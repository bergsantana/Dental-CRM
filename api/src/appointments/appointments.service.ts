import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lte, ne, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { appointments, clinicMembers, patients } from '../db/schema';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  AppointmentStatus,
  isTerminalStatus,
  isTransitionAllowed,
} from './status-machine';

type ClinicRole = 'owner' | 'dentist' | 'assistant' | 'receptionist';

@Injectable()
export class AppointmentsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async listForClinic(
    clinicId: string,
    opts: { from?: Date; to?: Date; dentistId?: string },
  ) {
    const conds = [eq(appointments.clinicId, clinicId)];
    if (opts.from) conds.push(gte(appointments.startsAt, opts.from));
    if (opts.to) conds.push(lte(appointments.startsAt, opts.to));
    if (opts.dentistId) conds.push(eq(appointments.dentistId, opts.dentistId));
    return this.db
      .select()
      .from(appointments)
      .where(and(...conds))
      .orderBy(asc(appointments.startsAt));
  }

  /** Cross-clinic agenda for the current user (their bookings as dentist). */
  async listForDentist(dentistId: string, opts: { from?: Date; to?: Date }) {
    const conds = [eq(appointments.dentistId, dentistId)];
    if (opts.from) conds.push(gte(appointments.startsAt, opts.from));
    if (opts.to) conds.push(lte(appointments.startsAt, opts.to));
    return this.db
      .select()
      .from(appointments)
      .where(and(...conds))
      .orderBy(asc(appointments.startsAt));
  }

  async getById(clinicId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!row) throw new NotFoundException();
    if (row.clinicId !== clinicId) throw new NotFoundException();
    return row;
  }

  async listForPatient(
    clinicId: string,
    patientId: string,
    opts: { from?: Date; to?: Date; upcoming?: boolean; limit?: number } = {},
  ) {
    const conds = [
      eq(appointments.clinicId, clinicId),
      eq(appointments.patientId, patientId),
    ];
    if (opts.upcoming) {
      conds.push(gte(appointments.startsAt, new Date()));
      conds.push(ne(appointments.status, 'cancelled'));
    }
    if (opts.from) conds.push(gte(appointments.startsAt, opts.from));
    if (opts.to) conds.push(lte(appointments.startsAt, opts.to));
    const q = this.db
      .select()
      .from(appointments)
      .where(and(...conds))
      .orderBy(asc(appointments.startsAt));
    return opts.limit ? q.limit(opts.limit) : q;
  }

  /**
   * Returns the first overlapping appointment for the same dentist
   * (excluding `excludeId`), or null. A row in status `cancelled` does
   * not block; everything else (including `requested`) does.
   */
  async findOverlap(
    dentistId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<{ id: string; startsAt: Date; endsAt: Date } | null> {
    const conds = [
      eq(appointments.dentistId, dentistId),
      ne(appointments.status, 'cancelled'),
      sql`${appointments.startsAt} < ${endsAt}`,
      sql`${appointments.endsAt} > ${startsAt}`,
    ];
    if (excludeId) conds.push(ne(appointments.id, excludeId));
    const [row] = await this.db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(and(...conds))
      .limit(1);
    return row ?? null;
  }

  async create(
    clinicId: string,
    createdBy: string,
    dto: CreateAppointmentDto,
  ) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Patient must belong to this clinic.
    const [patient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, dto.patientId), eq(patients.clinicId, clinicId)))
      .limit(1);
    if (!patient) throw new NotFoundException('Patient not in active clinic');

    // Dentist must be an active member of this clinic.
    const [member] = await this.db
      .select()
      .from(clinicMembers)
      .where(
        and(
          eq(clinicMembers.clinicId, clinicId),
          eq(clinicMembers.userId, dto.dentistId),
          eq(clinicMembers.isActive, true),
        ),
      )
      .limit(1);
    if (!member || !member.acceptedAt) {
      throw new BadRequestException('Dentist is not an active member of this clinic');
    }

    const overlap = await this.findOverlap(dto.dentistId, startsAt, endsAt);
    if (overlap) {
      throw new ConflictException({
        message: 'Dentist already has an appointment in that interval',
        conflict: overlap,
      });
    }

    const [row] = await this.db
      .insert(appointments)
      .values({
        clinicId,
        patientId: dto.patientId,
        dentistId: dto.dentistId,
        createdBy,
        startsAt,
        endsAt,
        reason: dto.reason,
        notes: dto.notes,
      })
      .returning();
    return row;
  }

  async update(
    clinicId: string,
    userId: string,
    role: ClinicRole,
    id: string,
    dto: UpdateAppointmentDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException();
    if (existing.clinicId !== clinicId) throw new ForbiddenException();

    // Authorization: owner/receptionist may modify any; dentist only their own.
    const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
    const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
    if (!isOwnerOrRecep && !isAssignedDentist) {
      throw new ForbiddenException(
        'Only owner, receptionist, or the assigned dentist can modify',
      );
    }

    const prevStatus = existing.status as AppointmentStatus;

    // Reject any change on a terminal record.
    if (isTerminalStatus(prevStatus)) {
      throw new ConflictException(
        `Cannot modify appointment in terminal status '${prevStatus}'`,
      );
    }

    if (dto.status && !isTransitionAllowed(prevStatus, dto.status)) {
      throw new ConflictException(
        `Illegal status transition '${prevStatus}' -> '${dto.status}'`,
      );
    }

    const patch: Partial<typeof existing> = { updatedAt: new Date() };
    let nextStartsAt: Date = existing.startsAt;
    let nextEndsAt: Date = existing.endsAt;
    if (dto.startsAt) {
      nextStartsAt = new Date(dto.startsAt);
      patch.startsAt = nextStartsAt;
    }
    if (dto.endsAt) {
      nextEndsAt = new Date(dto.endsAt);
      patch.endsAt = nextEndsAt;
    }
    if (dto.reason !== undefined) patch.reason = dto.reason;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.status) patch.status = dto.status;

    if (dto.startsAt || dto.endsAt) {
      if (nextEndsAt <= nextStartsAt) {
        throw new BadRequestException('endsAt must be after startsAt');
      }
      const overlap = await this.findOverlap(
        existing.dentistId,
        nextStartsAt,
        nextEndsAt,
        existing.id,
      );
      if (overlap) {
        throw new ConflictException({
          message: 'Dentist already has an appointment in that interval',
          conflict: overlap,
        });
      }
    }

    const [row] = await this.db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }

  /**
   * Soft-cancel: sets status to 'cancelled' and appends an optional reason
   * to notes. Idempotent: cancelling an already-cancelled record is a no-op.
   */
  async cancel(
    clinicId: string,
    userId: string,
    role: ClinicRole,
    id: string,
    reason?: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException();
    if (existing.clinicId !== clinicId) throw new ForbiddenException();

    if (existing.status === 'cancelled') return existing;

    const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
    const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
    if (!isOwnerOrRecep && !isAssignedDentist) {
      throw new ForbiddenException(
        'Only owner, receptionist, or the assigned dentist can cancel',
      );
    }

    const prevStatus = existing.status as AppointmentStatus;
    if (!isTransitionAllowed(prevStatus, 'cancelled')) {
      throw new ConflictException(
        `Cannot cancel appointment in status '${prevStatus}'`,
      );
    }

    const notes = reason
      ? [existing.notes, `[cancelado] ${reason}`].filter(Boolean).join('\n')
      : existing.notes;

    const [row] = await this.db
      .update(appointments)
      .set({ status: 'cancelled', notes, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }

  /** Approve a patient-requested appointment: requested -> confirmed. */
  async approve(clinicId: string, userId: string, role: ClinicRole, id: string) {
    const [existing] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException();
    if (existing.clinicId !== clinicId) throw new ForbiddenException();

    if (existing.status !== 'requested') {
      throw new ConflictException(
        `Only 'requested' appointments can be approved (current: '${existing.status}')`,
      );
    }

    const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
    const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
    if (!isOwnerOrRecep && !isAssignedDentist) {
      throw new ForbiddenException(
        'Only owner, receptionist, or the assigned dentist can approve',
      );
    }

    const [row] = await this.db
      .update(appointments)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }

  /** Reject a patient-requested appointment: requested -> cancelled. */
  async reject(
    clinicId: string,
    userId: string,
    role: ClinicRole,
    id: string,
    reason?: string,
  ) {
    const [existing] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException();
    if (existing.clinicId !== clinicId) throw new ForbiddenException();

    if (existing.status !== 'requested') {
      throw new ConflictException(
        `Only 'requested' appointments can be rejected (current: '${existing.status}')`,
      );
    }

    const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
    const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
    if (!isOwnerOrRecep && !isAssignedDentist) {
      throw new ForbiddenException(
        'Only owner, receptionist, or the assigned dentist can reject',
      );
    }

    const notes = reason
      ? [existing.notes, `[recusado] ${reason}`].filter(Boolean).join('\n')
      : existing.notes;

    const [row] = await this.db
      .update(appointments)
      .set({ status: 'cancelled', notes, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }

  /**
   * Patient-initiated booking via public token. Always lands in 'requested'.
   * Performs the same validations as create() (patient/dentist/overlap),
   * but bypasses the role guard (caller is anonymous).
   */
  async createRequested(
    clinicId: string,
    patientId: string,
    createdBy: string,
    dto: { dentistId: string; startsAt: string | Date; endsAt: string | Date; reason?: string },
  ) {
    const startsAt = new Date(dto.startsAt as any);
    const endsAt = new Date(dto.endsAt as any);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const [member] = await this.db
      .select()
      .from(clinicMembers)
      .where(
        and(
          eq(clinicMembers.clinicId, clinicId),
          eq(clinicMembers.userId, dto.dentistId),
          eq(clinicMembers.isActive, true),
        ),
      )
      .limit(1);
    if (!member || !member.acceptedAt) {
      throw new BadRequestException('Dentist is not an active member of this clinic');
    }

    const overlap = await this.findOverlap(dto.dentistId, startsAt, endsAt);
    if (overlap) {
      throw new ConflictException({
        message: 'Dentist already has an appointment in that interval',
        conflict: overlap,
      });
    }

    const [row] = await this.db
      .insert(appointments)
      .values({
        clinicId,
        patientId,
        dentistId: dto.dentistId,
        createdBy,
        startsAt,
        endsAt,
        reason: dto.reason,
        status: 'requested',
      })
      .returning();
    return row;
  }
}

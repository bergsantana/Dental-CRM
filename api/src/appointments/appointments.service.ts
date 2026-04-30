import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, between, eq, gte, lte, ne, or, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { appointments, clinicMembers, patients } from '../db/schema';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';

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

    // Overlap check (any non-cancelled appointment for the same dentist).
    const overlap = await this.db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.dentistId, dto.dentistId),
          ne(appointments.status, 'cancelled'),
          // overlap: existing.starts < new.ends AND existing.ends > new.starts
          sql`${appointments.startsAt} < ${endsAt}`,
          sql`${appointments.endsAt} > ${startsAt}`,
        ),
      )
      .limit(1);
    if (overlap.length > 0) {
      throw new BadRequestException('Dentist already has an appointment in that interval');
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
    role: string,
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

    // Only owners or the dentist themselves may modify.
    if (role !== 'owner' && existing.dentistId !== userId) {
      throw new ForbiddenException('Only the clinic owner or assigned dentist can modify');
    }

    const patch: Partial<typeof existing> = { updatedAt: new Date() };
    if (dto.startsAt) patch.startsAt = new Date(dto.startsAt);
    if (dto.endsAt) patch.endsAt = new Date(dto.endsAt);
    if (dto.reason !== undefined) patch.reason = dto.reason;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.status) patch.status = dto.status;

    const [row] = await this.db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }
}

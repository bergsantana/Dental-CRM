import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import {
  anamneses,
  appointments,
  patientDocuments,
  patients,
} from '../db/schema';
import type { CreatePatientDto } from './dto/create-patient.dto';
import type { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(clinicId: string, opts: { search?: string; specialty?: string }) {
    const conds = [eq(patients.clinicId, clinicId), isNull(patients.deletedAt)];
    if (opts.search) {
      conds.push(ilike(patients.fullName, `%${opts.search}%`));
    }
    if (opts.specialty) {
      conds.push(sql`${opts.specialty} = ANY(${patients.specialties})`);
    }
    return this.db
      .select()
      .from(patients)
      .where(and(...conds))
      .orderBy(desc(patients.createdAt))
      .limit(200);
  }

  async create(clinicId: string, dto: CreatePatientDto) {
    const [row] = await this.db
      .insert(patients)
      .values({ ...dto, clinicId, specialties: dto.specialties ?? [] })
      .returning();
    return row;
  }

  async getOrThrow(clinicId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
      .limit(1);
    if (!row) throw new NotFoundException('Patient not found');
    if (row.clinicId !== clinicId) throw new ForbiddenException();
    return row;
  }

  async update(clinicId: string, id: string, dto: UpdatePatientDto) {
    await this.getOrThrow(clinicId, id);
    const [row] = await this.db
      .update(patients)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return row;
  }

  async softDelete(clinicId: string, id: string) {
    await this.getOrThrow(clinicId, id);
    await this.db
      .update(patients)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(patients.id, id));
    return { id, deleted: true };
  }

  async timeline(clinicId: string, patientId: string) {
    await this.getOrThrow(clinicId, patientId);

    const [appts, anams, docs] = await Promise.all([
      this.db
        .select()
        .from(appointments)
        .where(eq(appointments.patientId, patientId))
        .orderBy(desc(appointments.startsAt)),
      this.db
        .select()
        .from(anamneses)
        .where(eq(anamneses.patientId, patientId))
        .orderBy(desc(anamneses.recordedAt)),
      this.db
        .select()
        .from(patientDocuments)
        .where(eq(patientDocuments.patientId, patientId))
        .orderBy(desc(patientDocuments.createdAt)),
    ]);

    type Entry = {
      type: 'appointment' | 'anamnesis' | 'document';
      at: Date;
      data: unknown;
    };
    const merged: Entry[] = [
      ...appts.map((a) => ({ type: 'appointment' as const, at: a.startsAt, data: a })),
      ...anams.map((a) => ({ type: 'anamnesis' as const, at: a.recordedAt, data: a })),
      ...docs.map((d) => ({ type: 'document' as const, at: d.createdAt, data: d })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    return merged;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_PROVIDER } from '../../../../core/providers/db.provider';
import { Patient } from '../../domain/entities/patient.entity';
import { PatientRepository } from '../../domain/repositories/patient.repository';
import { PatientMapper } from '../mappers/patient.mapper';
import { patients } from './patients.schema';

@Injectable()
export class PatientDrizzleRepository implements PatientRepository {
  constructor(
    @Inject(DB_PROVIDER)
    private readonly db: NodePgDatabase<Record<string, unknown>>,
  ) {}

  async findById(id: string): Promise<Patient | null> {
    const result = await this.db
      .select()
      .from(patients)
      .where(eq(patients.id, id));

    if (result.length === 0) {
      return null;
    }

    return PatientMapper.toDomain(result[0]);
  }

  async list(): Promise<Patient[]> {
    const result = await this.db
      .select()
      .from(patients)
      .orderBy(desc(patients.birthDate));

    return result.map((p) => PatientMapper.toDomain(p));
  }

  async create(patient: Patient): Promise<Patient> {
    const persistencePatient = PatientMapper.toPersistence(patient);

    const result = await this.db
      .insert(patients)
      .values(persistencePatient)
      .returning();

    const insertedUser = result[0];
    if (!insertedUser) {
      throw new Error('Failed to create question');
    }

    return PatientMapper.toDomain(insertedUser);
  }
}

import { Patient } from '../../domain/entities/patient.entity';
import { patients } from '../drizzle/patients.schema';

type PatientSchema = typeof patients.$inferSelect;

export class PatientMapper {
  static toDomain(raw: PatientSchema): Patient {
    return new Patient({
      id: raw.id,
      name: raw.name,
      birthDate: new Date(raw.birthDate),
      primaryDentist: raw.primaryDentist,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(patient: Patient) {
    return {
      id: patient.id,
      name: patient.name,
      birthDate: patient.birthDate.toISOString().split('T')[0],
      primaryDentist: patient.primaryDentist,
    };
  }
}

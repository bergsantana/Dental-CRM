import { Patient } from '../entities/patient.entity';

export abstract class PatientRepository {
  abstract findById(id: string): Promise<Patient | null>;
  abstract create(patient: Patient): Promise<Patient>;
  abstract list(): Promise<Patient[]>;
}

import { Patient } from 'src/modules/patients/domain/entities/patient.entity';

export type PatientOutput = {
  id: string;
  name: string;
  birthDate: Date;
  primaryDentist: string;
};

export class PatientOutputMapper {
  static toOutput(patient: Patient): PatientOutput {
    return {
      id: patient.id,
      name: patient.name,
      primaryDentist: patient.primaryDentist,
      birthDate: patient.birthDate,
    };
  }
}

export type PatientCollectionOutput = {
  count: number;
  data: PatientOutput[];
};

export class PatientCollectionOutputMapper {
  static toOutput(patients: Patient[]): PatientCollectionOutput {
    return {
      count: patients.length,
      data: patients.map((p) => PatientOutputMapper.toOutput(p)),
    };
  }
}

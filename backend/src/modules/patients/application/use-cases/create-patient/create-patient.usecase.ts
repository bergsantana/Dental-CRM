import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Patient } from 'src/modules/patients/domain/entities/patient.entity';
import { PatientRepository } from 'src/modules/patients/domain/repositories/patient.repository';
import { PatientOutput, PatientOutputMapper } from '../common/output';
import { CreatePatientInput } from './create-patient.input';

@Injectable()
export class CreatePatientUseCase {
  constructor(private readonly repo: PatientRepository) {}

  async execute(input: CreatePatientInput): Promise<PatientOutput> {
    const today = new Date();

    if (input.birthDate.getTime() > today.getTime()) {
      throw new UnprocessableEntityException(
        'Impossível criar paciente futuro',
      );
    }

    const patient = new Patient(input);

    const res = await this.repo.create(patient);
    return PatientOutputMapper.toOutput(res);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientRepository } from 'src/modules/patients/domain/repositories/patient.repository';
import { PatientOutput, PatientOutputMapper } from '../common/output';
import { FindPatientByIdInput } from './find-patient-by-id.input';

@Injectable()
export class FindPatientByIdUseCase {
  constructor(private readonly repo: PatientRepository) {}

  async execute(input: FindPatientByIdInput): Promise<PatientOutput> {
    const patient = await this.repo.findById(input.id);
    if (!patient) {
      throw new NotFoundException('Paciente não consta no sistema.');
    }

    return PatientOutputMapper.toOutput(patient);
  }
}

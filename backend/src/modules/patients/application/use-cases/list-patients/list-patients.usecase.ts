import { Injectable } from '@nestjs/common';
import { PatientRepository } from 'src/modules/patients/domain/repositories/patient.repository';
import {
  PatientCollectionOutput,
  PatientCollectionOutputMapper,
} from '../common/output';
import { ListPatientsInput } from './list-patients.input';

@Injectable()
export class ListPatientsUseCase {
  constructor(private readonly repo: PatientRepository) {}

  async execute(input: ListPatientsInput): Promise<PatientCollectionOutput> {
    const patients = await this.repo.list();
    return PatientCollectionOutputMapper.toOutput(patients);
  }
}

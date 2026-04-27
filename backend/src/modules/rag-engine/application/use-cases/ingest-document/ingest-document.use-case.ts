import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { PatientRepository } from '../../../patients/domain/repositories/patient.repository';
import { IngestDocumentInput } from './ingest-document.input';

@Injectable()
export class IngestDocumentUseCase {
  constructor(
    @Inject(PatientRepository)
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(input: IngestDocumentInput): Promise<void> {
    const patient = await this.patientRepository.findById(input.patientId);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const formData = new FormData();
    formData.append('file', input.file, 'file');

    await axios.post('http://rag-app:3000/ingest', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
  }
}

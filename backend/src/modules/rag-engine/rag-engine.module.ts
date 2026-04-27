import { Module } from '@nestjs/common';
import { IngestDocumentUseCase } from './application/use-cases/ingest-document/ingest-document.use-case';
import { RagEngineController } from './presentation/controllers/rag-engine.controller';
import { PatientsModule } from '../patients/patients.module';
import { PatientRepository } from '../patients/domain/repositories/patient.repository';
import { PatientDrizzleRepository } from '../patients/infra/drizzle/patient-drizzle.repository';
import { dbProvider } from '../../core/providers/db.provider';

@Module({
  imports: [PatientsModule],
  controllers: [RagEngineController],
  providers: [
    IngestDocumentUseCase,
    dbProvider,
    {
      provide: PatientRepository,
      useClass: PatientDrizzleRepository,
    },
  ],
})
export class RagEngineModule {}

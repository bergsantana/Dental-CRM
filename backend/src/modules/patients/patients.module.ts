import { Module } from '@nestjs/common';
import { dbProvider } from '../../core/providers/db.provider';
import { CreatePatientUseCase } from './application/use-cases/create-patient/create-patient.usecase';
import { FindPatientByIdUseCase } from './application/use-cases/find-patient-by-id/find-patient-by-id.usecase';
import { ListPatientsUseCase } from './application/use-cases/list-patients/list-patients.usecase';
import { PatientRepository } from './domain/repositories/patient.repository';
import { PatientDrizzleRepository } from './infra/drizzle/patient-drizzle.repository';
import { PatientsController } from './presentation/controllers/patients.controller';

@Module({
  providers: [
    dbProvider,
    {
      provide: PatientRepository,
      useClass: PatientDrizzleRepository,
    },
    CreatePatientUseCase,
    ListPatientsUseCase,
    FindPatientByIdUseCase,
  ],
  controllers: [PatientsController],
  exports: [PatientRepository],
})
export class PatientsModule {}

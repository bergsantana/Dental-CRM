import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PatientsModule } from './modules/patients/patients.module';
import { RagEngineModule } from './modules/rag-engine/rag-engine.module';
import { ClinicalRecordsModule } from './modules/clinical-records/clinical-records.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicsModule } from './modules/clinics/clinics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RagEngineModule,
    PatientsModule,
    ClinicalRecordsModule,
    AppointmentsModule,
    ClinicsModule,
  ],
  providers: [Logger],
})
export class AppModule {}

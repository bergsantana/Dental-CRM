import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnamnesesModule } from './anamneses/anamneses.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ClinicsModule } from './clinics/clinics.module';
import { DbModule } from './db/db.module';
import { DocumentsModule } from './documents/documents.module';
import { PatientsModule } from './patients/patients.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    RagModule,
    AuthModule,
    ClinicsModule,
    PatientsModule,
    AnamnesesModule,
    AppointmentsModule,
    DocumentsModule,
    ChatModule,
  ],
})
export class AppModule {}

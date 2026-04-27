import { Logger, Module } from '@nestjs/common';
import { PatientsModule } from './modules/patients/patients.module';
import { RagEngineModule } from './modules/rag-engine/rag-engine.module';

@Module({
  imports: [RagEngineModule, PatientsModule],
  providers: [Logger],
})
export class AppModule {}

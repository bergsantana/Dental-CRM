import { Module } from '@nestjs/common';
import { ClinicsController } from './presentation/controllers/clinics.controller';

@Module({
  controllers: [ClinicsController],
  providers: [],
})
export class ClinicsModule {}

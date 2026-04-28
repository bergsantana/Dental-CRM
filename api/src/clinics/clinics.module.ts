import { Module } from '@nestjs/common';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';

@Module({
  providers: [ClinicsService],
  controllers: [ClinicsController],
  exports: [ClinicsService],
})
export class ClinicsModule {}

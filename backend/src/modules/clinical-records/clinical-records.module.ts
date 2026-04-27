import { Module } from '@nestjs/common';
import { ClinicalRecordsController } from './presentation/controllers/clinical-records.controller';

@Module({
  controllers: [ClinicalRecordsController],
  providers: [],
})
export class ClinicalRecordsModule {}

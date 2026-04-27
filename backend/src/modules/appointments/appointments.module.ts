import { Module } from '@nestjs/common';
import { AppointmentsController } from './presentation/controllers/appointments.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [],
})
export class AppointmentsModule {}

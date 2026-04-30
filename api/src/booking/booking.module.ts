import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AppointmentsModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}

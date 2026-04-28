import { IsIn, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

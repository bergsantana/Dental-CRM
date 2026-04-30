import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  dentistId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

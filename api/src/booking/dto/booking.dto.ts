import { IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateBookingTokenDto {
  /** Time-to-live in minutes (default 7 days). */
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(60 * 24 * 30)
  ttlMinutes?: number;
}

export class SubmitBookingDto {
  @IsUUID()
  dentistId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsInt()
  @Min(5)
  @Max(8 * 60)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

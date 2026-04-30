import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export const CHAT_ACTION_KINDS = [
  'list_upcoming',
  'create',
  'reschedule',
  'cancel',
  'approve',
  'reject',
] as const;
export type ChatActionKind = (typeof CHAT_ACTION_KINDS)[number];

export class ChatActionArgsDto {
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  dentistId?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class ChatActionDto {
  @IsIn(CHAT_ACTION_KINDS as unknown as string[])
  kind!: ChatActionKind;

  @IsIn(['preview', 'commit'])
  mode!: 'preview' | 'commit';

  @IsOptional()
  args?: ChatActionArgsDto;
}

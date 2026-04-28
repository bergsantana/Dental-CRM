import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateChatSessionDto {
  @IsUUID()
  patientId!: string;
}

export class PostMessageDto {
  @IsString()
  @MinLength(1)
  question!: string;
}

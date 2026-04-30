import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAnamnesisDto {
  @IsArray()
  @IsString({ each: true })
  specialties!: string[];

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  presentIllnessHistory?: string;

  @IsOptional()
  @IsString()
  allergiesSummary?: string;

  @IsOptional()
  @IsString()
  medicationsSummary?: string;

  @IsOptional()
  @IsBoolean()
  underMedicalTreatment?: boolean;

  @IsOptional()
  @IsBoolean()
  pregnant?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(42)
  gestationalWeeks?: number;

  @IsOptional()
  @IsBoolean()
  lactating?: boolean;

  @IsOptional()
  @IsBoolean()
  smoker?: boolean;

  @IsOptional()
  @IsString()
  alcoholUse?: string;

  @IsOptional()
  @IsBoolean()
  bruxism?: boolean;

  @IsOptional()
  @IsDateString()
  lastDentalVisit?: string;

  /** Full structured questionnaire payload — see docs/anamnesis-schema.md. */
  @IsObject()
  answers!: Record<string, unknown>;

  @IsBoolean()
  consentSigned!: boolean;

  @IsOptional()
  @IsString()
  signatureUrl?: string;
}

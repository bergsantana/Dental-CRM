import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreatePatientDto {
  name!: string;
  birthDate!: Date;
  primaryDentist!: string;
}

export class CreatePatientInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: Date;

  @IsString()
  @IsNotEmpty()
  primaryDentist: string;

  constructor({ birthDate, name, primaryDentist }: CreatePatientDto) {
    this.name = name;
    this.birthDate = birthDate;
    this.primaryDentist = primaryDentist;
  }
}

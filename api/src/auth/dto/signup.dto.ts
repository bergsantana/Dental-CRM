import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(2)
  clinicName!: string;

  @IsOptional()
  @IsString()
  cro?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

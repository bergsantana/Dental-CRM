import { IsEmail, IsIn } from 'class-validator';
import type { ClinicRole } from '../../common/decorators/roles.decorator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['owner', 'dentist', 'assistant', 'receptionist'])
  role!: ClinicRole;
}

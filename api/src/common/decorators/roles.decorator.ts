import { SetMetadata } from '@nestjs/common';

export type ClinicRole = 'owner' | 'dentist' | 'assistant' | 'receptionist';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ClinicRole[]) => SetMetadata(ROLES_KEY, roles);

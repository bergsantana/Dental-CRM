import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ClinicRole } from './roles.decorator';

export interface ClinicContext {
  clinicId: string;
  role: ClinicRole;
}

export const ActiveClinic = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClinicContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.clinicContext;
  },
);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Db } from '../../db/db.module';
import { clinicMembers } from '../../db/schema';

/**
 * Reads the active clinic from the `X-Clinic-Id` header and verifies the
 * authenticated user has an active membership for that clinic. On success it
 * attaches `req.clinicContext = { clinicId, role }`.
 *
 * Routes that don't need a clinic context (e.g. /auth/*, GET /clinics)
 * should not include this guard.
 */
@Injectable()
export class ClinicContextGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: Db) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { userId: string } | undefined;
    if (!user) throw new UnauthorizedException();

    const clinicId =
      (req.headers['x-clinic-id'] as string | undefined) ??
      (req.headers['X-Clinic-Id'] as string | undefined);
    if (!clinicId) {
      throw new ForbiddenException('Missing X-Clinic-Id header');
    }

    const [membership] = await this.db
      .select()
      .from(clinicMembers)
      .where(
        and(
          eq(clinicMembers.clinicId, clinicId),
          eq(clinicMembers.userId, user.userId),
          eq(clinicMembers.isActive, true),
        ),
      )
      .limit(1);

    if (!membership || !membership.acceptedAt) {
      throw new ForbiddenException('Not a member of this clinic');
    }

    req.clinicContext = { clinicId, role: membership.role };
    return true;
  }
}

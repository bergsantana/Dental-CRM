import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { clinicMembers, clinics, users } from '../db/schema';
import type { CreateClinicDto } from './dto/create-clinic.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class ClinicsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async listForUser(userId: string) {
    const rows = await this.db
      .select({
        clinic: clinics,
        membership: clinicMembers,
      })
      .from(clinicMembers)
      .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
      .where(and(eq(clinicMembers.userId, userId), isNull(clinics.deletedAt)))
      .orderBy(desc(clinicMembers.createdAt));

    return rows.map((r) => ({
      ...r.clinic,
      role: r.membership.role,
      isActive: r.membership.isActive,
      pending: r.membership.acceptedAt === null,
    }));
  }

  async create(userId: string, dto: CreateClinicDto) {
    return this.db.transaction(async (tx) => {
      const [clinic] = await tx.insert(clinics).values(dto).returning();
      await tx.insert(clinicMembers).values({
        clinicId: clinic.id,
        userId,
        role: 'owner',
        isActive: true,
        acceptedAt: new Date(),
      });
      return clinic;
    });
  }

  async listMembers(clinicId: string) {
    return this.db
      .select({
        membershipId: clinicMembers.id,
        role: clinicMembers.role,
        isActive: clinicMembers.isActive,
        acceptedAt: clinicMembers.acceptedAt,
        invitedAt: clinicMembers.invitedAt,
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        cro: users.cro,
      })
      .from(clinicMembers)
      .innerJoin(users, eq(users.id, clinicMembers.userId))
      .where(eq(clinicMembers.clinicId, clinicId));
  }

  async listDentists(clinicId: string) {
    return this.db
      .select({
        userId: users.id,
        fullName: users.fullName,
        cro: users.cro,
      })
      .from(clinicMembers)
      .innerJoin(users, eq(users.id, clinicMembers.userId))
      .where(
        and(
          eq(clinicMembers.clinicId, clinicId),
          eq(clinicMembers.isActive, true),
          // owners can also act as dentists if they have a CRO; we list them all
        ),
      );
  }

  async invite(clinicId: string, dto: InviteMemberDto) {
    const [user] = await this.db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (!user) {
      throw new NotFoundException('User with this email not found. Ask them to sign up first.');
    }

    const [existing] = await this.db
      .select()
      .from(clinicMembers)
      .where(
        and(eq(clinicMembers.clinicId, clinicId), eq(clinicMembers.userId, user.id)),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('User is already a member or has a pending invitation');
    }

    const [member] = await this.db
      .insert(clinicMembers)
      .values({
        clinicId,
        userId: user.id,
        role: dto.role,
        isActive: true,
        invitedAt: new Date(),
      })
      .returning();

    return member;
  }

  async listInvitations(userId: string) {
    return this.db
      .select({
        id: clinicMembers.id,
        clinicId: clinicMembers.clinicId,
        clinicName: clinics.name,
        role: clinicMembers.role,
        invitedAt: clinicMembers.invitedAt,
      })
      .from(clinicMembers)
      .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
      .where(and(eq(clinicMembers.userId, userId), isNull(clinicMembers.acceptedAt)));
  }

  async respondInvitation(userId: string, membershipId: string, accept: boolean) {
    const [membership] = await this.db
      .select()
      .from(clinicMembers)
      .where(eq(clinicMembers.id, membershipId))
      .limit(1);
    if (!membership) throw new NotFoundException();
    if (membership.userId !== userId) throw new ForbiddenException();
    if (membership.acceptedAt) throw new ConflictException('Already responded');

    if (accept) {
      const [updated] = await this.db
        .update(clinicMembers)
        .set({ acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(clinicMembers.id, membershipId))
        .returning();
      return updated;
    } else {
      await this.db.delete(clinicMembers).where(eq(clinicMembers.id, membershipId));
      return { id: membershipId, declined: true };
    }
  }
}

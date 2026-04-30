import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { clinicMembers, clinics, users } from '../db/schema';
import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          cro: dto.cro,
          phone: dto.phone,
        })
        .returning();

      const [clinic] = await tx
        .insert(clinics)
        .values({ name: dto.clinicName })
        .returning();

      await tx.insert(clinicMembers).values({
        clinicId: clinic.id,
        userId: user.id,
        role: 'owner',
        isActive: true,
        acceptedAt: new Date(),
      });

      return {
        user: this.sanitize(user),
        clinic,
        token: this.signToken(user.id, user.email),
      };
    });
  }

  async login(dto: LoginDto) {
    const [user] = await this.db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      user: this.sanitize(user),
      token: this.signToken(user.id, user.email),
    };
  }

  async me(userId: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private signToken(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email });
  }

  private sanitize(u: typeof users.$inferSelect) {
    const { passwordHash: _, ...rest } = u;
    return rest;
  }
}

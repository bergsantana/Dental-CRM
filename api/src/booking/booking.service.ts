import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, asc, eq, gte, isNull, lte, ne, sql } from 'drizzle-orm';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { DB, type Db } from '../db/db.module';
import {
  appointments,
  bookingTokens,
  clinicMembers,
  clinics,
  patients,
  users,
} from '../db/schema';
import { AppointmentsService } from '../appointments/appointments.service';
import { SubmitBookingDto } from './dto/booking.dto';

const DEFAULT_TTL_MIN = 60 * 24 * 7; // 7 days
const MAX_BUSY_WINDOW_DAYS = 14;

function sha256Hex(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function constantTimeEq(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class BookingService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly appointmentsService: AppointmentsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Create a single-use booking token for a patient. Returns the raw token
   * (shown ONCE to the staff member) plus the public booking URL.
   */
  async createToken(
    clinicId: string,
    patientId: string,
    createdBy: string,
    ttlMinutes?: number,
  ) {
    // Patient must belong to this clinic.
    const [patient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .limit(1);
    if (!patient) throw new NotFoundException('Patient not in active clinic');

    const raw = randomBytes(32).toString('base64url'); // 43 chars, URL-safe
    const tokenHash = sha256Hex(raw);
    const ttl = Math.max(15, Math.min(60 * 24 * 30, ttlMinutes ?? DEFAULT_TTL_MIN));
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    const [row] = await this.db
      .insert(bookingTokens)
      .values({ clinicId, patientId, tokenHash, expiresAt, createdBy })
      .returning();

    const appOrigin =
      this.config.get<string>('APP_ORIGIN') ?? 'http://localhost:3567';
    const url = `${appOrigin.replace(/\/$/, '')}/book/${raw}`;

    return {
      id: row.id,
      token: raw,
      url,
      expiresAt: row.expiresAt,
    };
  }

  /** Look up token by raw value. Throws 404/410 as appropriate. */
  private async loadValidToken(rawToken: string) {
    const tokenHash = sha256Hex(rawToken);
    const [tok] = await this.db
      .select()
      .from(bookingTokens)
      .where(eq(bookingTokens.tokenHash, tokenHash))
      .limit(1);
    if (!tok) throw new NotFoundException('Invalid booking link');
    // Constant-time re-check (defense in depth; sha256 of attacker-controlled
    // input vs stored hash already prevents timing leaks, but be explicit).
    if (!constantTimeEq(tok.tokenHash, tokenHash)) {
      throw new NotFoundException('Invalid booking link');
    }
    if (tok.usedAt) throw new GoneException('Booking link already used');
    if (tok.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('Booking link has expired');
    }
    return tok;
  }

  /** Public payload for the patient booking page. */
  async getPublic(rawToken: string) {
    const tok = await this.loadValidToken(rawToken);

    const [clinic] = await this.db
      .select({ id: clinics.id, name: clinics.name })
      .from(clinics)
      .where(eq(clinics.id, tok.clinicId))
      .limit(1);
    const [patient] = await this.db
      .select({ id: patients.id, fullName: patients.fullName })
      .from(patients)
      .where(eq(patients.id, tok.patientId))
      .limit(1);

    // Active dentists in the clinic.
    const dentists = await this.db
      .select({ id: users.id, fullName: users.fullName, cro: users.cro })
      .from(clinicMembers)
      .innerJoin(users, eq(clinicMembers.userId, users.id))
      .where(
        and(
          eq(clinicMembers.clinicId, tok.clinicId),
          eq(clinicMembers.role, 'dentist'),
          eq(clinicMembers.isActive, true),
        ),
      );

    // Busy slots for next N days (any non-cancelled appointment).
    const now = new Date();
    const horizon = new Date(now.getTime() + MAX_BUSY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const busy = await this.db
      .select({
        dentistId: appointments.dentistId,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, tok.clinicId),
          ne(appointments.status, 'cancelled'),
          gte(appointments.startsAt, now),
          lte(appointments.startsAt, horizon),
        ),
      )
      .orderBy(asc(appointments.startsAt));

    return {
      clinic,
      patient,
      dentists: dentists.filter((d) => d.id), // accepted members only — verified via isActive
      busySlots: busy,
      expiresAt: tok.expiresAt,
    };
  }

  /**
   * Patient submits the booking. Atomically marks the token used, then creates
   * the appointment in 'requested' status. If the time slot was taken between
   * the GET and the POST, returns 409 with refreshed busy slots.
   */
  async submit(rawToken: string, dto: SubmitBookingDto) {
    const tok = await this.loadValidToken(rawToken);

    // Atomic consume: only succeeds if used_at is still null.
    const updated = await this.db
      .update(bookingTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(bookingTokens.id, tok.id), isNull(bookingTokens.usedAt)))
      .returning({ id: bookingTokens.id });
    if (updated.length === 0) {
      throw new GoneException('Booking link already used');
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + dto.durationMinutes * 60 * 1000);

    try {
      const appt = await this.appointmentsService.createRequested(
        tok.clinicId,
        tok.patientId,
        tok.createdBy,
        { dentistId: dto.dentistId, startsAt, endsAt, reason: dto.reason },
      );
      return { ok: true, appointment: appt };
    } catch (err) {
      // Refund the token so the patient can retry without re-asking the clinic
      // for a new link, but only on validation/conflict errors.
      if (err instanceof ConflictException || err instanceof ForbiddenException) {
        await this.db
          .update(bookingTokens)
          .set({ usedAt: null })
          .where(eq(bookingTokens.id, tok.id));
      }
      throw err;
    }
  }
}

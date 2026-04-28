import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq } from 'drizzle-orm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { DB, type Db } from '../db/db.module';
import { anamneses, patients } from '../db/schema';
import { RagService } from '../rag/rag.service';
import type { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import type { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';

@Injectable()
export class AnamnesesService {
  private readonly logger = new Logger(AnamnesesService.name);
  private readonly documentsDir: string;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ConfigService) config: ConfigService,
    private readonly rag: RagService,
  ) {
    this.documentsDir = config.get<string>('DOCUMENTS_DIR') ?? './data/documents';
  }

  async listForPatient(clinicId: string, patientId: string) {
    await this.assertPatient(clinicId, patientId);
    return this.db
      .select()
      .from(anamneses)
      .where(eq(anamneses.patientId, patientId))
      .orderBy(desc(anamneses.recordedAt));
  }

  async create(
    clinicId: string,
    patientId: string,
    userId: string,
    dto: CreateAnamnesisDto,
  ) {
    await this.assertPatient(clinicId, patientId);
    if (!dto.consentSigned) {
      throw new BadRequestException('Consent must be signed');
    }
    if (dto.pregnant === true && !dto.gestationalWeeks) {
      throw new BadRequestException('gestationalWeeks required when pregnant');
    }

    const [row] = await this.db
      .insert(anamneses)
      .values({
        clinicId,
        patientId,
        recordedBy: userId,
        recordedAt: new Date(),
        specialties: dto.specialties,
        chiefComplaint: dto.chiefComplaint,
        presentIllnessHistory: dto.presentIllnessHistory,
        allergiesSummary: dto.allergiesSummary,
        medicationsSummary: dto.medicationsSummary,
        underMedicalTreatment: dto.underMedicalTreatment ?? false,
        pregnant: dto.pregnant,
        gestationalWeeks: dto.gestationalWeeks,
        lactating: dto.lactating,
        smoker: dto.smoker ?? false,
        alcoholUse: dto.alcoholUse,
        bruxism: dto.bruxism ?? false,
        lastDentalVisit: dto.lastDentalVisit,
        answers: dto.answers,
        consentSigned: dto.consentSigned,
        consentSignedAt: dto.consentSigned ? new Date() : null,
        signatureUrl: dto.signatureUrl,
      })
      .returning();

    void this.ingestInBackground(patientId, row);

    return row;
  }

  private async ingestInBackground(
    patientId: string,
    row: typeof anamneses.$inferSelect,
  ) {
    try {
      const dir = join(this.documentsDir, 'patients', patientId);
      await mkdir(dir, { recursive: true });
      const path = join(dir, `anamnesis-${row.id}.json`);
      // Render as a single labelled JSON record so the rag json loader
      // produces one chunk with structured "key: value" lines.
      const payload = {
        kind: 'anamnesis',
        anamnesisId: row.id,
        recordedAt: row.recordedAt?.toISOString?.() ?? row.recordedAt,
        specialties: row.specialties,
        chiefComplaint: row.chiefComplaint,
        presentIllnessHistory: row.presentIllnessHistory,
        allergiesSummary: row.allergiesSummary,
        medicationsSummary: row.medicationsSummary,
        underMedicalTreatment: row.underMedicalTreatment,
        pregnant: row.pregnant,
        gestationalWeeks: row.gestationalWeeks,
        lactating: row.lactating,
        smoker: row.smoker,
        alcoholUse: row.alcoholUse,
        bruxism: row.bruxism,
        lastDentalVisit: row.lastDentalVisit,
        answers: row.answers,
      };
      await writeFile(path, JSON.stringify(payload, null, 2), 'utf8');

      await this.rag.ingest({
        patientId,
        files: [{ path, mime: 'application/json' }],
      });
    } catch (err) {
      this.logger.error(
        `Anamnesis ingest failed for patient ${patientId}: ${(err as Error).message}`,
      );
    }
  }

  async update(clinicId: string, id: string, dto: UpdateAnamnesisDto) {
    const existing = await this.get(clinicId, id);
    if (dto.pregnant === true && !(dto.gestationalWeeks ?? existing.gestationalWeeks)) {
      throw new BadRequestException('gestationalWeeks required when pregnant');
    }

    const updates: Partial<typeof anamneses.$inferInsert> = {};
    if (dto.specialties !== undefined) updates.specialties = dto.specialties;
    if (dto.chiefComplaint !== undefined) updates.chiefComplaint = dto.chiefComplaint;
    if (dto.presentIllnessHistory !== undefined)
      updates.presentIllnessHistory = dto.presentIllnessHistory;
    if (dto.allergiesSummary !== undefined) updates.allergiesSummary = dto.allergiesSummary;
    if (dto.medicationsSummary !== undefined) updates.medicationsSummary = dto.medicationsSummary;
    if (dto.underMedicalTreatment !== undefined)
      updates.underMedicalTreatment = dto.underMedicalTreatment;
    if (dto.pregnant !== undefined) updates.pregnant = dto.pregnant;
    if (dto.gestationalWeeks !== undefined) updates.gestationalWeeks = dto.gestationalWeeks;
    if (dto.lactating !== undefined) updates.lactating = dto.lactating;
    if (dto.smoker !== undefined) updates.smoker = dto.smoker;
    if (dto.alcoholUse !== undefined) updates.alcoholUse = dto.alcoholUse;
    if (dto.bruxism !== undefined) updates.bruxism = dto.bruxism;
    if (dto.lastDentalVisit !== undefined) updates.lastDentalVisit = dto.lastDentalVisit;
    if (dto.answers !== undefined) updates.answers = dto.answers;
    if (dto.signatureUrl !== undefined) updates.signatureUrl = dto.signatureUrl;
    if (dto.consentSigned !== undefined) {
      updates.consentSigned = dto.consentSigned;
      if (dto.consentSigned && !existing.consentSignedAt) {
        updates.consentSignedAt = new Date();
      }
    }

    const [row] = await this.db
      .update(anamneses)
      .set(updates)
      .where(eq(anamneses.id, id))
      .returning();

    void this.ingestInBackground(existing.patientId, row);

    return row;
  }

  async get(clinicId: string, id: string) {
    const [row] = await this.db.select().from(anamneses).where(eq(anamneses.id, id)).limit(1);
    if (!row) throw new NotFoundException();
    if (row.clinicId !== clinicId) throw new ForbiddenException();
    return row;
  }

  private async assertPatient(clinicId: string, patientId: string) {
    const [p] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .limit(1);
    if (!p) throw new NotFoundException('Patient not found in active clinic');
  }
}

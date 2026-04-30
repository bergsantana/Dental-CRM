import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { DB, type Db } from '../db/db.module';
import { patientDocuments, patients } from '../db/schema';
import { RagService } from '../rag/rag.service';

export interface UploadedFile {
  filename: string;
  mime: string;
  buffer: Buffer;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly documentsDir: string;

  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ConfigService) config: ConfigService,
    private readonly rag: RagService,
  ) {
    this.documentsDir = config.get<string>('DOCUMENTS_DIR') ?? './data/documents';
  }

  async list(clinicId: string, patientId: string) {
    await this.assertPatient(clinicId, patientId);
    return this.db
      .select()
      .from(patientDocuments)
      .where(eq(patientDocuments.patientId, patientId))
      .orderBy(desc(patientDocuments.createdAt));
  }

  async upload(
    clinicId: string,
    patientId: string,
    userId: string,
    files: UploadedFile[],
  ) {
    await this.assertPatient(clinicId, patientId);
    if (files.length === 0) throw new BadRequestException('No files uploaded');

    const dir = join(this.documentsDir, 'patients', patientId);
    await mkdir(dir, { recursive: true });

    const stored: { row: typeof patientDocuments.$inferSelect; path: string; mime: string }[] = [];

    for (const file of files) {
      const id = randomUUID();
      const ext = extname(file.filename) || '';
      const safeName = file.filename.replace(/[^\w.\-]+/g, '_');
      const fullPath = join(dir, `${id}-${safeName}${ext && !file.filename.endsWith(ext) ? ext : ''}`);
      await writeFile(fullPath, file.buffer);

      const [row] = await this.db
        .insert(patientDocuments)
        .values({
          id,
          clinicId,
          patientId,
          uploadedBy: userId,
          filename: file.filename,
          mimeType: file.mime,
          sizeBytes: file.buffer.length,
          storageUrl: fullPath,
          ingestStatus: 'pending',
        })
        .returning();
      stored.push({ row, path: fullPath, mime: file.mime });
    }

    // Fire-and-forget ingest into rag-pipeline. We update status when done.
    void this.ingestInBackground(patientId, stored);

    return stored.map((s) => s.row);
  }

  async remove(clinicId: string, patientId: string, documentId: string) {
    await this.assertPatient(clinicId, patientId);
    const [doc] = await this.db
      .select()
      .from(patientDocuments)
      .where(and(eq(patientDocuments.id, documentId), eq(patientDocuments.patientId, patientId)))
      .limit(1);
    if (!doc) throw new NotFoundException();

    try {
      await this.rag.deletePatientSource(patientId, doc.storageUrl);
    } catch (err) {
      this.logger.warn(`rag deleteSource failed: ${(err as Error).message}`);
    }
    try {
      await unlink(doc.storageUrl);
    } catch {
      // file may already be gone; ignore
    }
    await this.db.delete(patientDocuments).where(eq(patientDocuments.id, documentId));
    return { id: documentId, deleted: true };
  }

  private async ingestInBackground(
    patientId: string,
    files: { row: { id: string }; path: string; mime: string }[],
  ) {
    try {
      await this.db
        .update(patientDocuments)
        .set({ ingestStatus: 'processing' })
        .where(eq(patientDocuments.patientId, patientId));

      const result = await this.rag.ingest({
        patientId,
        files: files.map((f) => ({ path: f.path, mime: f.mime })),
      });

      for (const f of files) {
        await this.db
          .update(patientDocuments)
          .set({
            ingestStatus: 'ready',
            chunkCount: Math.ceil(result.chunks / files.length),
            ingestedAt: new Date(),
          })
          .where(eq(patientDocuments.id, f.row.id));
      }
    } catch (err) {
      this.logger.error(`Ingest failed for patient ${patientId}: ${(err as Error).message}`);
      for (const f of files) {
        await this.db
          .update(patientDocuments)
          .set({
            ingestStatus: 'failed',
            ingestError: (err as Error).message.slice(0, 1000),
          })
          .where(eq(patientDocuments.id, f.row.id));
      }
    }
  }

  private async assertPatient(clinicId: string, patientId: string) {
    const [p] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .limit(1);
    if (!p) throw new NotFoundException('Patient not found in active clinic');
    if (p.clinicId !== clinicId) throw new ForbiddenException();
  }
}

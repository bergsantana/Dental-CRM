"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const drizzle_orm_1 = require("drizzle-orm");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
const rag_service_1 = require("../rag/rag.service");
let DocumentsService = DocumentsService_1 = class DocumentsService {
    db;
    rag;
    logger = new common_1.Logger(DocumentsService_1.name);
    documentsDir;
    constructor(db, config, rag) {
        this.db = db;
        this.rag = rag;
        this.documentsDir = config.get('DOCUMENTS_DIR') ?? './data/documents';
    }
    async list(clinicId, patientId) {
        await this.assertPatient(clinicId, patientId);
        return this.db
            .select()
            .from(schema_1.patientDocuments)
            .where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.patientId, patientId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.patientDocuments.createdAt));
    }
    async upload(clinicId, patientId, userId, files) {
        await this.assertPatient(clinicId, patientId);
        if (files.length === 0)
            throw new common_1.BadRequestException('No files uploaded');
        const dir = (0, path_1.join)(this.documentsDir, 'patients', patientId);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        const stored = [];
        for (const file of files) {
            const id = (0, crypto_1.randomUUID)();
            const ext = (0, path_1.extname)(file.filename) || '';
            const safeName = file.filename.replace(/[^\w.\-]+/g, '_');
            const fullPath = (0, path_1.join)(dir, `${id}-${safeName}${ext && !file.filename.endsWith(ext) ? ext : ''}`);
            await (0, promises_1.writeFile)(fullPath, file.buffer);
            const [row] = await this.db
                .insert(schema_1.patientDocuments)
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
        void this.ingestInBackground(patientId, stored);
        return stored.map((s) => s.row);
    }
    async remove(clinicId, patientId, documentId) {
        await this.assertPatient(clinicId, patientId);
        const [doc] = await this.db
            .select()
            .from(schema_1.patientDocuments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patientDocuments.id, documentId), (0, drizzle_orm_1.eq)(schema_1.patientDocuments.patientId, patientId)))
            .limit(1);
        if (!doc)
            throw new common_1.NotFoundException();
        try {
            await this.rag.deletePatientSource(patientId, doc.storageUrl);
        }
        catch (err) {
            this.logger.warn(`rag deleteSource failed: ${err.message}`);
        }
        try {
            await (0, promises_1.unlink)(doc.storageUrl);
        }
        catch {
        }
        await this.db.delete(schema_1.patientDocuments).where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.id, documentId));
        return { id: documentId, deleted: true };
    }
    async ingestInBackground(patientId, files) {
        try {
            await this.db
                .update(schema_1.patientDocuments)
                .set({ ingestStatus: 'processing' })
                .where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.patientId, patientId));
            const result = await this.rag.ingest({
                patientId,
                files: files.map((f) => ({ path: f.path, mime: f.mime })),
            });
            for (const f of files) {
                await this.db
                    .update(schema_1.patientDocuments)
                    .set({
                    ingestStatus: 'ready',
                    chunkCount: Math.ceil(result.chunks / files.length),
                    ingestedAt: new Date(),
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.id, f.row.id));
            }
        }
        catch (err) {
            this.logger.error(`Ingest failed for patient ${patientId}: ${err.message}`);
            for (const f of files) {
                await this.db
                    .update(schema_1.patientDocuments)
                    .set({
                    ingestStatus: 'failed',
                    ingestError: err.message.slice(0, 1000),
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.id, f.row.id));
            }
        }
    }
    async assertPatient(clinicId, patientId) {
        const [p] = await this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, patientId), (0, drizzle_orm_1.eq)(schema_1.patients.clinicId, clinicId)))
            .limit(1);
        if (!p)
            throw new common_1.NotFoundException('Patient not found in active clinic');
        if (p.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __param(1, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        rag_service_1.RagService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map
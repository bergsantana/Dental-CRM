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
var AnamnesesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnamnesesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_orm_1 = require("drizzle-orm");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
const rag_service_1 = require("../rag/rag.service");
let AnamnesesService = AnamnesesService_1 = class AnamnesesService {
    db;
    rag;
    logger = new common_1.Logger(AnamnesesService_1.name);
    documentsDir;
    constructor(db, config, rag) {
        this.db = db;
        this.rag = rag;
        this.documentsDir = config.get('DOCUMENTS_DIR') ?? './data/documents';
    }
    async listForPatient(clinicId, patientId) {
        await this.assertPatient(clinicId, patientId);
        return this.db
            .select()
            .from(schema_1.anamneses)
            .where((0, drizzle_orm_1.eq)(schema_1.anamneses.patientId, patientId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.anamneses.recordedAt));
    }
    async create(clinicId, patientId, userId, dto) {
        await this.assertPatient(clinicId, patientId);
        if (!dto.consentSigned) {
            throw new common_1.BadRequestException('Consent must be signed');
        }
        if (dto.pregnant === true && !dto.gestationalWeeks) {
            throw new common_1.BadRequestException('gestationalWeeks required when pregnant');
        }
        const [row] = await this.db
            .insert(schema_1.anamneses)
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
    async ingestInBackground(patientId, row) {
        try {
            const dir = (0, path_1.join)(this.documentsDir, 'patients', patientId);
            await (0, promises_1.mkdir)(dir, { recursive: true });
            const path = (0, path_1.join)(dir, `anamnesis-${row.id}.json`);
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
            await (0, promises_1.writeFile)(path, JSON.stringify(payload, null, 2), 'utf8');
            await this.rag.ingest({
                patientId,
                files: [{ path, mime: 'application/json' }],
            });
        }
        catch (err) {
            this.logger.error(`Anamnesis ingest failed for patient ${patientId}: ${err.message}`);
        }
    }
    async update(clinicId, id, dto) {
        const existing = await this.get(clinicId, id);
        if (dto.pregnant === true && !(dto.gestationalWeeks ?? existing.gestationalWeeks)) {
            throw new common_1.BadRequestException('gestationalWeeks required when pregnant');
        }
        const updates = {};
        if (dto.specialties !== undefined)
            updates.specialties = dto.specialties;
        if (dto.chiefComplaint !== undefined)
            updates.chiefComplaint = dto.chiefComplaint;
        if (dto.presentIllnessHistory !== undefined)
            updates.presentIllnessHistory = dto.presentIllnessHistory;
        if (dto.allergiesSummary !== undefined)
            updates.allergiesSummary = dto.allergiesSummary;
        if (dto.medicationsSummary !== undefined)
            updates.medicationsSummary = dto.medicationsSummary;
        if (dto.underMedicalTreatment !== undefined)
            updates.underMedicalTreatment = dto.underMedicalTreatment;
        if (dto.pregnant !== undefined)
            updates.pregnant = dto.pregnant;
        if (dto.gestationalWeeks !== undefined)
            updates.gestationalWeeks = dto.gestationalWeeks;
        if (dto.lactating !== undefined)
            updates.lactating = dto.lactating;
        if (dto.smoker !== undefined)
            updates.smoker = dto.smoker;
        if (dto.alcoholUse !== undefined)
            updates.alcoholUse = dto.alcoholUse;
        if (dto.bruxism !== undefined)
            updates.bruxism = dto.bruxism;
        if (dto.lastDentalVisit !== undefined)
            updates.lastDentalVisit = dto.lastDentalVisit;
        if (dto.answers !== undefined)
            updates.answers = dto.answers;
        if (dto.signatureUrl !== undefined)
            updates.signatureUrl = dto.signatureUrl;
        if (dto.consentSigned !== undefined) {
            updates.consentSigned = dto.consentSigned;
            if (dto.consentSigned && !existing.consentSignedAt) {
                updates.consentSignedAt = new Date();
            }
        }
        const [row] = await this.db
            .update(schema_1.anamneses)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.anamneses.id, id))
            .returning();
        void this.ingestInBackground(existing.patientId, row);
        return row;
    }
    async get(clinicId, id) {
        const [row] = await this.db.select().from(schema_1.anamneses).where((0, drizzle_orm_1.eq)(schema_1.anamneses.id, id)).limit(1);
        if (!row)
            throw new common_1.NotFoundException();
        if (row.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        return row;
    }
    async assertPatient(clinicId, patientId) {
        const [p] = await this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, patientId), (0, drizzle_orm_1.eq)(schema_1.patients.clinicId, clinicId)))
            .limit(1);
        if (!p)
            throw new common_1.NotFoundException('Patient not found in active clinic');
    }
};
exports.AnamnesesService = AnamnesesService;
exports.AnamnesesService = AnamnesesService = AnamnesesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __param(1, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        rag_service_1.RagService])
], AnamnesesService);
//# sourceMappingURL=anamneses.service.js.map
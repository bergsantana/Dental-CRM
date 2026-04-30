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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let PatientsService = class PatientsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async list(clinicId, opts) {
        const conds = [(0, drizzle_orm_1.eq)(schema_1.patients.clinicId, clinicId), (0, drizzle_orm_1.isNull)(schema_1.patients.deletedAt)];
        if (opts.search) {
            const term = opts.search.trim();
            const digits = term.replace(/\D+/g, '');
            if (digits.length > 0) {
                conds.push((0, drizzle_orm_1.sql) `(${schema_1.patients.fullName} ILIKE ${'%' + term + '%'} OR regexp_replace(coalesce(${schema_1.patients.cpf}, ''), '\\D', '', 'g') ILIKE ${'%' + digits + '%'})`);
            }
            else {
                conds.push((0, drizzle_orm_1.ilike)(schema_1.patients.fullName, `%${term}%`));
            }
        }
        if (opts.specialty) {
            conds.push((0, drizzle_orm_1.sql) `${opts.specialty} = ANY(${schema_1.patients.specialties})`);
        }
        return this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)(...conds))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.patients.createdAt))
            .limit(200);
    }
    async create(clinicId, dto) {
        const [row] = await this.db
            .insert(schema_1.patients)
            .values({ ...dto, clinicId, specialties: dto.specialties ?? [] })
            .returning();
        return row;
    }
    async getOrThrow(clinicId, id) {
        const [row] = await this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, id), (0, drizzle_orm_1.isNull)(schema_1.patients.deletedAt)))
            .limit(1);
        if (!row)
            throw new common_1.NotFoundException('Patient not found');
        if (row.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        return row;
    }
    async update(clinicId, id, dto) {
        await this.getOrThrow(clinicId, id);
        const [row] = await this.db
            .update(schema_1.patients)
            .set({ ...dto, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.patients.id, id))
            .returning();
        return row;
    }
    async softDelete(clinicId, id) {
        await this.getOrThrow(clinicId, id);
        await this.db
            .update(schema_1.patients)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.patients.id, id));
        return { id, deleted: true };
    }
    async timeline(clinicId, patientId) {
        await this.getOrThrow(clinicId, patientId);
        const [appts, anams, docs] = await Promise.all([
            this.db
                .select()
                .from(schema_1.appointments)
                .where((0, drizzle_orm_1.eq)(schema_1.appointments.patientId, patientId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.appointments.startsAt)),
            this.db
                .select()
                .from(schema_1.anamneses)
                .where((0, drizzle_orm_1.eq)(schema_1.anamneses.patientId, patientId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.anamneses.recordedAt)),
            this.db
                .select()
                .from(schema_1.patientDocuments)
                .where((0, drizzle_orm_1.eq)(schema_1.patientDocuments.patientId, patientId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.patientDocuments.createdAt)),
        ]);
        const merged = [
            ...appts.map((a) => ({ type: 'appointment', at: a.startsAt, data: a })),
            ...anams.map((a) => ({ type: 'anamnesis', at: a.recordedAt, data: a })),
            ...docs.map((d) => ({ type: 'document', at: d.createdAt, data: d })),
        ].sort((a, b) => b.at.getTime() - a.at.getTime());
        return merged;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], PatientsService);
//# sourceMappingURL=patients.service.js.map
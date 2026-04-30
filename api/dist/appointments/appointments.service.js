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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let AppointmentsService = class AppointmentsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listForClinic(clinicId, opts) {
        const conds = [(0, drizzle_orm_1.eq)(schema_1.appointments.clinicId, clinicId)];
        if (opts.from)
            conds.push((0, drizzle_orm_1.gte)(schema_1.appointments.startsAt, opts.from));
        if (opts.to)
            conds.push((0, drizzle_orm_1.lte)(schema_1.appointments.startsAt, opts.to));
        if (opts.dentistId)
            conds.push((0, drizzle_orm_1.eq)(schema_1.appointments.dentistId, opts.dentistId));
        return this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.and)(...conds))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.appointments.startsAt));
    }
    async listForDentist(dentistId, opts) {
        const conds = [(0, drizzle_orm_1.eq)(schema_1.appointments.dentistId, dentistId)];
        if (opts.from)
            conds.push((0, drizzle_orm_1.gte)(schema_1.appointments.startsAt, opts.from));
        if (opts.to)
            conds.push((0, drizzle_orm_1.lte)(schema_1.appointments.startsAt, opts.to));
        return this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.and)(...conds))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.appointments.startsAt));
    }
    async create(clinicId, createdBy, dto) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (endsAt <= startsAt) {
            throw new common_1.BadRequestException('endsAt must be after startsAt');
        }
        const [patient] = await this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, dto.patientId), (0, drizzle_orm_1.eq)(schema_1.patients.clinicId, clinicId)))
            .limit(1);
        if (!patient)
            throw new common_1.NotFoundException('Patient not in active clinic');
        const [member] = await this.db
            .select()
            .from(schema_1.clinicMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, dto.dentistId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.isActive, true)))
            .limit(1);
        if (!member || !member.acceptedAt) {
            throw new common_1.BadRequestException('Dentist is not an active member of this clinic');
        }
        const overlap = await this.db
            .select({ id: schema_1.appointments.id })
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.appointments.dentistId, dto.dentistId), (0, drizzle_orm_1.ne)(schema_1.appointments.status, 'cancelled'), (0, drizzle_orm_1.sql) `${schema_1.appointments.startsAt} < ${endsAt}`, (0, drizzle_orm_1.sql) `${schema_1.appointments.endsAt} > ${startsAt}`))
            .limit(1);
        if (overlap.length > 0) {
            throw new common_1.BadRequestException('Dentist already has an appointment in that interval');
        }
        const [row] = await this.db
            .insert(schema_1.appointments)
            .values({
            clinicId,
            patientId: dto.patientId,
            dentistId: dto.dentistId,
            createdBy,
            startsAt,
            endsAt,
            reason: dto.reason,
            notes: dto.notes,
        })
            .returning();
        return row;
    }
    async update(clinicId, userId, role, id, dto) {
        const [existing] = await this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .limit(1);
        if (!existing)
            throw new common_1.NotFoundException();
        if (existing.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        if (role !== 'owner' && existing.dentistId !== userId) {
            throw new common_1.ForbiddenException('Only the clinic owner or assigned dentist can modify');
        }
        const patch = { updatedAt: new Date() };
        if (dto.startsAt)
            patch.startsAt = new Date(dto.startsAt);
        if (dto.endsAt)
            patch.endsAt = new Date(dto.endsAt);
        if (dto.reason !== undefined)
            patch.reason = dto.reason;
        if (dto.notes !== undefined)
            patch.notes = dto.notes;
        if (dto.status)
            patch.status = dto.status;
        const [row] = await this.db
            .update(schema_1.appointments)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .returning();
        return row;
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map
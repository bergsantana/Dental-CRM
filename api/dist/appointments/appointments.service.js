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
const status_machine_1 = require("./status-machine");
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
    async getById(clinicId, id) {
        const [row] = await this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .limit(1);
        if (!row)
            throw new common_1.NotFoundException();
        if (row.clinicId !== clinicId)
            throw new common_1.NotFoundException();
        return row;
    }
    async listForPatient(clinicId, patientId, opts = {}) {
        const conds = [
            (0, drizzle_orm_1.eq)(schema_1.appointments.clinicId, clinicId),
            (0, drizzle_orm_1.eq)(schema_1.appointments.patientId, patientId),
        ];
        if (opts.upcoming) {
            conds.push((0, drizzle_orm_1.gte)(schema_1.appointments.startsAt, new Date()));
            conds.push((0, drizzle_orm_1.ne)(schema_1.appointments.status, 'cancelled'));
        }
        if (opts.from)
            conds.push((0, drizzle_orm_1.gte)(schema_1.appointments.startsAt, opts.from));
        if (opts.to)
            conds.push((0, drizzle_orm_1.lte)(schema_1.appointments.startsAt, opts.to));
        const q = this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.and)(...conds))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.appointments.startsAt));
        return opts.limit ? q.limit(opts.limit) : q;
    }
    async findOverlap(dentistId, startsAt, endsAt, excludeId) {
        const conds = [
            (0, drizzle_orm_1.eq)(schema_1.appointments.dentistId, dentistId),
            (0, drizzle_orm_1.ne)(schema_1.appointments.status, 'cancelled'),
            (0, drizzle_orm_1.sql) `${schema_1.appointments.startsAt} < ${endsAt}`,
            (0, drizzle_orm_1.sql) `${schema_1.appointments.endsAt} > ${startsAt}`,
        ];
        if (excludeId)
            conds.push((0, drizzle_orm_1.ne)(schema_1.appointments.id, excludeId));
        const [row] = await this.db
            .select({
            id: schema_1.appointments.id,
            startsAt: schema_1.appointments.startsAt,
            endsAt: schema_1.appointments.endsAt,
        })
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.and)(...conds))
            .limit(1);
        return row ?? null;
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
        const overlap = await this.findOverlap(dto.dentistId, startsAt, endsAt);
        if (overlap) {
            throw new common_1.ConflictException({
                message: 'Dentist already has an appointment in that interval',
                conflict: overlap,
            });
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
        const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
        const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
        if (!isOwnerOrRecep && !isAssignedDentist) {
            throw new common_1.ForbiddenException('Only owner, receptionist, or the assigned dentist can modify');
        }
        const prevStatus = existing.status;
        if ((0, status_machine_1.isTerminalStatus)(prevStatus)) {
            throw new common_1.ConflictException(`Cannot modify appointment in terminal status '${prevStatus}'`);
        }
        if (dto.status && !(0, status_machine_1.isTransitionAllowed)(prevStatus, dto.status)) {
            throw new common_1.ConflictException(`Illegal status transition '${prevStatus}' -> '${dto.status}'`);
        }
        const patch = { updatedAt: new Date() };
        let nextStartsAt = existing.startsAt;
        let nextEndsAt = existing.endsAt;
        if (dto.startsAt) {
            nextStartsAt = new Date(dto.startsAt);
            patch.startsAt = nextStartsAt;
        }
        if (dto.endsAt) {
            nextEndsAt = new Date(dto.endsAt);
            patch.endsAt = nextEndsAt;
        }
        if (dto.reason !== undefined)
            patch.reason = dto.reason;
        if (dto.notes !== undefined)
            patch.notes = dto.notes;
        if (dto.status)
            patch.status = dto.status;
        if (dto.startsAt || dto.endsAt) {
            if (nextEndsAt <= nextStartsAt) {
                throw new common_1.BadRequestException('endsAt must be after startsAt');
            }
            const overlap = await this.findOverlap(existing.dentistId, nextStartsAt, nextEndsAt, existing.id);
            if (overlap) {
                throw new common_1.ConflictException({
                    message: 'Dentist already has an appointment in that interval',
                    conflict: overlap,
                });
            }
        }
        const [row] = await this.db
            .update(schema_1.appointments)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .returning();
        return row;
    }
    async cancel(clinicId, userId, role, id, reason) {
        const [existing] = await this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .limit(1);
        if (!existing)
            throw new common_1.NotFoundException();
        if (existing.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        if (existing.status === 'cancelled')
            return existing;
        const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
        const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
        if (!isOwnerOrRecep && !isAssignedDentist) {
            throw new common_1.ForbiddenException('Only owner, receptionist, or the assigned dentist can cancel');
        }
        const prevStatus = existing.status;
        if (!(0, status_machine_1.isTransitionAllowed)(prevStatus, 'cancelled')) {
            throw new common_1.ConflictException(`Cannot cancel appointment in status '${prevStatus}'`);
        }
        const notes = reason
            ? [existing.notes, `[cancelado] ${reason}`].filter(Boolean).join('\n')
            : existing.notes;
        const [row] = await this.db
            .update(schema_1.appointments)
            .set({ status: 'cancelled', notes, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .returning();
        return row;
    }
    async approve(clinicId, userId, role, id) {
        const [existing] = await this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .limit(1);
        if (!existing)
            throw new common_1.NotFoundException();
        if (existing.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        if (existing.status !== 'requested') {
            throw new common_1.ConflictException(`Only 'requested' appointments can be approved (current: '${existing.status}')`);
        }
        const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
        const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
        if (!isOwnerOrRecep && !isAssignedDentist) {
            throw new common_1.ForbiddenException('Only owner, receptionist, or the assigned dentist can approve');
        }
        const [row] = await this.db
            .update(schema_1.appointments)
            .set({ status: 'confirmed', updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .returning();
        return row;
    }
    async reject(clinicId, userId, role, id, reason) {
        const [existing] = await this.db
            .select()
            .from(schema_1.appointments)
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .limit(1);
        if (!existing)
            throw new common_1.NotFoundException();
        if (existing.clinicId !== clinicId)
            throw new common_1.ForbiddenException();
        if (existing.status !== 'requested') {
            throw new common_1.ConflictException(`Only 'requested' appointments can be rejected (current: '${existing.status}')`);
        }
        const isOwnerOrRecep = role === 'owner' || role === 'receptionist';
        const isAssignedDentist = role === 'dentist' && existing.dentistId === userId;
        if (!isOwnerOrRecep && !isAssignedDentist) {
            throw new common_1.ForbiddenException('Only owner, receptionist, or the assigned dentist can reject');
        }
        const notes = reason
            ? [existing.notes, `[recusado] ${reason}`].filter(Boolean).join('\n')
            : existing.notes;
        const [row] = await this.db
            .update(schema_1.appointments)
            .set({ status: 'cancelled', notes, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.appointments.id, id))
            .returning();
        return row;
    }
    async createRequested(clinicId, patientId, createdBy, dto) {
        const startsAt = new Date(dto.startsAt);
        const endsAt = new Date(dto.endsAt);
        if (endsAt <= startsAt) {
            throw new common_1.BadRequestException('endsAt must be after startsAt');
        }
        const [member] = await this.db
            .select()
            .from(schema_1.clinicMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, dto.dentistId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.isActive, true)))
            .limit(1);
        if (!member || !member.acceptedAt) {
            throw new common_1.BadRequestException('Dentist is not an active member of this clinic');
        }
        const overlap = await this.findOverlap(dto.dentistId, startsAt, endsAt);
        if (overlap) {
            throw new common_1.ConflictException({
                message: 'Dentist already has an appointment in that interval',
                conflict: overlap,
            });
        }
        const [row] = await this.db
            .insert(schema_1.appointments)
            .values({
            clinicId,
            patientId,
            dentistId: dto.dentistId,
            createdBy,
            startsAt,
            endsAt,
            reason: dto.reason,
            status: 'requested',
        })
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
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
exports.ClinicsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let ClinicsService = class ClinicsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async listForUser(userId) {
        const rows = await this.db
            .select({
            clinic: schema_1.clinics,
            membership: schema_1.clinicMembers,
        })
            .from(schema_1.clinicMembers)
            .innerJoin(schema_1.clinics, (0, drizzle_orm_1.eq)(schema_1.clinics.id, schema_1.clinicMembers.clinicId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.clinics.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.clinicMembers.createdAt));
        return rows.map((r) => ({
            ...r.clinic,
            role: r.membership.role,
            isActive: r.membership.isActive,
            pending: r.membership.acceptedAt === null,
        }));
    }
    async create(userId, dto) {
        return this.db.transaction(async (tx) => {
            const [clinic] = await tx.insert(schema_1.clinics).values(dto).returning();
            await tx.insert(schema_1.clinicMembers).values({
                clinicId: clinic.id,
                userId,
                role: 'owner',
                isActive: true,
                acceptedAt: new Date(),
            });
            return clinic;
        });
    }
    async listMembers(clinicId) {
        return this.db
            .select({
            membershipId: schema_1.clinicMembers.id,
            role: schema_1.clinicMembers.role,
            isActive: schema_1.clinicMembers.isActive,
            acceptedAt: schema_1.clinicMembers.acceptedAt,
            invitedAt: schema_1.clinicMembers.invitedAt,
            userId: schema_1.users.id,
            email: schema_1.users.email,
            fullName: schema_1.users.fullName,
            cro: schema_1.users.cro,
        })
            .from(schema_1.clinicMembers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.clinicMembers.userId))
            .where((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId));
    }
    async listDentists(clinicId) {
        return this.db
            .select({
            userId: schema_1.users.id,
            fullName: schema_1.users.fullName,
            cro: schema_1.users.cro,
        })
            .from(schema_1.clinicMembers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.clinicMembers.userId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.isActive, true)));
    }
    async invite(clinicId, dto) {
        const [user] = await this.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, dto.email)).limit(1);
        if (!user) {
            throw new common_1.NotFoundException('User with this email not found. Ask them to sign up first.');
        }
        const [existing] = await this.db
            .select()
            .from(schema_1.clinicMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, user.id)))
            .limit(1);
        if (existing) {
            throw new common_1.ConflictException('User is already a member or has a pending invitation');
        }
        const [member] = await this.db
            .insert(schema_1.clinicMembers)
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
    async listInvitations(userId) {
        return this.db
            .select({
            id: schema_1.clinicMembers.id,
            clinicId: schema_1.clinicMembers.clinicId,
            clinicName: schema_1.clinics.name,
            role: schema_1.clinicMembers.role,
            invitedAt: schema_1.clinicMembers.invitedAt,
        })
            .from(schema_1.clinicMembers)
            .innerJoin(schema_1.clinics, (0, drizzle_orm_1.eq)(schema_1.clinics.id, schema_1.clinicMembers.clinicId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.clinicMembers.acceptedAt)));
    }
    async respondInvitation(userId, membershipId, accept) {
        const [membership] = await this.db
            .select()
            .from(schema_1.clinicMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.clinicMembers.id, membershipId))
            .limit(1);
        if (!membership)
            throw new common_1.NotFoundException();
        if (membership.userId !== userId)
            throw new common_1.ForbiddenException();
        if (membership.acceptedAt)
            throw new common_1.ConflictException('Already responded');
        if (accept) {
            const [updated] = await this.db
                .update(schema_1.clinicMembers)
                .set({ acceptedAt: new Date(), updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.clinicMembers.id, membershipId))
                .returning();
            return updated;
        }
        else {
            await this.db.delete(schema_1.clinicMembers).where((0, drizzle_orm_1.eq)(schema_1.clinicMembers.id, membershipId));
            return { id: membershipId, declined: true };
        }
    }
};
exports.ClinicsService = ClinicsService;
exports.ClinicsService = ClinicsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], ClinicsService);
//# sourceMappingURL=clinics.service.js.map
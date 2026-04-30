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
exports.ClinicContextGuard = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../../db/db.module");
const schema_1 = require("../../db/schema");
let ClinicContextGuard = class ClinicContextGuard {
    db;
    constructor(db) {
        this.db = db;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        if (!user)
            throw new common_1.UnauthorizedException();
        const clinicId = req.headers['x-clinic-id'] ??
            req.headers['X-Clinic-Id'];
        if (!clinicId) {
            throw new common_1.ForbiddenException('Missing X-Clinic-Id header');
        }
        const [membership] = await this.db
            .select()
            .from(schema_1.clinicMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.clinicMembers.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.userId, user.userId), (0, drizzle_orm_1.eq)(schema_1.clinicMembers.isActive, true)))
            .limit(1);
        if (!membership || !membership.acceptedAt) {
            throw new common_1.ForbiddenException('Not a member of this clinic');
        }
        req.clinicContext = { clinicId, role: membership.role };
        return true;
    }
};
exports.ClinicContextGuard = ClinicContextGuard;
exports.ClinicContextGuard = ClinicContextGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], ClinicContextGuard);
//# sourceMappingURL=clinic-context.guard.js.map
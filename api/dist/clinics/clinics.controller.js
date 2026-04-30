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
exports.ClinicsController = void 0;
const common_1 = require("@nestjs/common");
const clinic_context_decorator_1 = require("../common/decorators/clinic-context.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const clinic_context_guard_1 = require("../common/guards/clinic-context.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const clinics_service_1 = require("./clinics.service");
const create_clinic_dto_1 = require("./dto/create-clinic.dto");
const invite_member_dto_1 = require("./dto/invite-member.dto");
let ClinicsController = class ClinicsController {
    clinics;
    constructor(clinics) {
        this.clinics = clinics;
    }
    list(user) {
        return this.clinics.listForUser(user.userId);
    }
    create(user, dto) {
        return this.clinics.create(user.userId, dto);
    }
    listMembers(ctx) {
        return this.clinics.listMembers(ctx.clinicId);
    }
    listDentists(ctx) {
        return this.clinics.listDentists(ctx.clinicId);
    }
    invite(ctx, dto) {
        return this.clinics.invite(ctx.clinicId, dto);
    }
    listInvitations(user) {
        return this.clinics.listInvitations(user.userId);
    }
    accept(user, id) {
        return this.clinics.respondInvitation(user.userId, id, true);
    }
    decline(user, id) {
        return this.clinics.respondInvitation(user.userId, id, false);
    }
};
exports.ClinicsController = ClinicsController;
__decorate([
    (0, common_1.Get)('clinics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('clinics'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_clinic_dto_1.CreateClinicDto]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Get)('clinics/current/members'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "listMembers", null);
__decorate([
    (0, common_1.UseGuards)(clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Get)('clinics/current/dentists'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "listDentists", null);
__decorate([
    (0, common_1.UseGuards)(clinic_context_guard_1.ClinicContextGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner'),
    (0, common_1.Post)('clinics/current/members/invite'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_member_dto_1.InviteMemberDto]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "invite", null);
__decorate([
    (0, common_1.Get)('invitations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "listInvitations", null);
__decorate([
    (0, common_1.Post)('invitations/:id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('invitations/:id/decline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "decline", null);
exports.ClinicsController = ClinicsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [clinics_service_1.ClinicsService])
], ClinicsController);
//# sourceMappingURL=clinics.controller.js.map
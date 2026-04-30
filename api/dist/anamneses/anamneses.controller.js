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
exports.AnamnesesController = void 0;
const common_1 = require("@nestjs/common");
const clinic_context_decorator_1 = require("../common/decorators/clinic-context.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const clinic_context_guard_1 = require("../common/guards/clinic-context.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const anamneses_service_1 = require("./anamneses.service");
const create_anamnesis_dto_1 = require("./dto/create-anamnesis.dto");
const update_anamnesis_dto_1 = require("./dto/update-anamnesis.dto");
let AnamnesesController = class AnamnesesController {
    anamneses;
    constructor(anamneses) {
        this.anamneses = anamneses;
    }
    list(ctx, patientId) {
        return this.anamneses.listForPatient(ctx.clinicId, patientId);
    }
    create(ctx, user, patientId, dto) {
        return this.anamneses.create(ctx.clinicId, patientId, user.userId, dto);
    }
    get(ctx, id) {
        return this.anamneses.get(ctx.clinicId, id);
    }
    update(ctx, id, dto) {
        return this.anamneses.update(ctx.clinicId, id, dto);
    }
};
exports.AnamnesesController = AnamnesesController;
__decorate([
    (0, common_1.Get)('patients/:patientId/anamneses'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist'),
    (0, common_1.Post)('patients/:patientId/anamneses'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, create_anamnesis_dto_1.CreateAnamnesisDto]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('anamneses/:id'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist'),
    (0, common_1.Patch)('anamneses/:id'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_anamnesis_dto_1.UpdateAnamnesisDto]),
    __metadata("design:returntype", void 0)
], AnamnesesController.prototype, "update", null);
exports.AnamnesesController = AnamnesesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [anamneses_service_1.AnamnesesService])
], AnamnesesController);
//# sourceMappingURL=anamneses.controller.js.map
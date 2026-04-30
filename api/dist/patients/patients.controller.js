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
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const clinic_context_decorator_1 = require("../common/decorators/clinic-context.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const clinic_context_guard_1 = require("../common/guards/clinic-context.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_patient_dto_1 = require("./dto/create-patient.dto");
const update_patient_dto_1 = require("./dto/update-patient.dto");
const patients_service_1 = require("./patients.service");
let PatientsController = class PatientsController {
    patients;
    constructor(patients) {
        this.patients = patients;
    }
    list(ctx, search, specialty) {
        return this.patients.list(ctx.clinicId, { search, specialty });
    }
    create(ctx, dto) {
        return this.patients.create(ctx.clinicId, dto);
    }
    get(ctx, id) {
        return this.patients.getOrThrow(ctx.clinicId, id);
    }
    timeline(ctx, id) {
        return this.patients.timeline(ctx.clinicId, id);
    }
    update(ctx, id, dto) {
        return this.patients.update(ctx.clinicId, id, dto);
    }
    remove(ctx, id) {
        return this.patients.softDelete(ctx.clinicId, id);
    }
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('specialty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist', 'receptionist'),
    (0, common_1.Post)(),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_patient_dto_1.CreatePatientDto]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "timeline", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist', 'receptionist'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_patient_dto_1.UpdatePatientDto]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "remove", null);
exports.PatientsController = PatientsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Controller)({ path: 'patients', version: '1' }),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map
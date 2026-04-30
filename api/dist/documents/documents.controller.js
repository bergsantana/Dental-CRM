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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const clinic_context_decorator_1 = require("../common/decorators/clinic-context.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const clinic_context_guard_1 = require("../common/guards/clinic-context.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const documents_service_1 = require("./documents.service");
let DocumentsController = class DocumentsController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    list(ctx, patientId) {
        return this.documents.list(ctx.clinicId, patientId);
    }
    async upload(ctx, user, patientId, req) {
        if (!req.isMultipart()) {
            throw new common_1.BadRequestException('Expected multipart/form-data');
        }
        const collected = [];
        for await (const part of req.parts()) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer();
                collected.push({
                    filename: part.filename,
                    mime: part.mimetype,
                    buffer,
                });
            }
        }
        return this.documents.upload(ctx.clinicId, patientId, user.userId, collected);
    }
    remove(ctx, patientId, documentId) {
        return this.documents.remove(ctx.clinicId, patientId, documentId);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)('patients/:patientId/documents'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist', 'assistant'),
    (0, common_1.Post)('patients/:patientId/documents'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('owner', 'dentist'),
    (0, common_1.Delete)('patients/:patientId/documents/:documentId'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('documentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Controller)({ version: '1' }),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map
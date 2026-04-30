"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const anamneses_module_1 = require("./anamneses/anamneses.module");
const appointments_module_1 = require("./appointments/appointments.module");
const auth_module_1 = require("./auth/auth.module");
const booking_module_1 = require("./booking/booking.module");
const chat_module_1 = require("./chat/chat.module");
const clinics_module_1 = require("./clinics/clinics.module");
const db_module_1 = require("./db/db.module");
const documents_module_1 = require("./documents/documents.module");
const patients_module_1 = require("./patients/patients.module");
const rag_module_1 = require("./rag/rag.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            db_module_1.DbModule,
            rag_module_1.RagModule,
            auth_module_1.AuthModule,
            clinics_module_1.ClinicsModule,
            patients_module_1.PatientsModule,
            anamneses_module_1.AnamnesesModule,
            appointments_module_1.AppointmentsModule,
            booking_module_1.BookingModule,
            documents_module_1.DocumentsModule,
            chat_module_1.ChatModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
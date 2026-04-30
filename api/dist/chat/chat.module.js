"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const appointments_module_1 = require("../appointments/appointments.module");
const rag_module_1 = require("../rag/rag.module");
const chat_actions_controller_1 = require("./chat-actions.controller");
const chat_actions_service_1 = require("./chat-actions.service");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [rag_module_1.RagModule, appointments_module_1.AppointmentsModule],
        providers: [chat_service_1.ChatService, chat_actions_service_1.ChatActionsService],
        controllers: [chat_controller_1.ChatController, chat_actions_controller_1.ChatActionsController],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map
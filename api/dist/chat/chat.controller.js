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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const clinic_context_decorator_1 = require("../common/decorators/clinic-context.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const clinic_context_guard_1 = require("../common/guards/clinic-context.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rag_service_1 = require("../rag/rag.service");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
let ChatController = class ChatController {
    chat;
    rag;
    constructor(chat, rag) {
        this.chat = chat;
        this.rag = rag;
    }
    health() {
        return this.rag.health();
    }
    createSession(ctx, user, dto) {
        return this.chat.createSession(ctx.clinicId, user.userId, dto.patientId);
    }
    listSessions(ctx, user, patientId) {
        return this.chat.listSessions(ctx.clinicId, user.userId, patientId);
    }
    async listMessages(ctx, user, id) {
        await this.chat.getSession(ctx.clinicId, user.userId, id);
        return this.chat.listMessages(id);
    }
    async postMessage(ctx, user, id, dto, req, reply) {
        const session = await this.chat.getSession(ctx.clinicId, user.userId, id);
        await this.chat.appendMessage(session.id, 'user', dto.question);
        const origin = req.headers.origin;
        const corsHeaders = {};
        if (typeof origin === 'string' && origin.length > 0) {
            corsHeaders['access-control-allow-origin'] = origin;
            corsHeaders['access-control-allow-credentials'] = 'true';
            corsHeaders['vary'] = 'Origin';
        }
        reply.raw.writeHead(200, {
            ...corsHeaders,
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache, no-transform',
            connection: 'keep-alive',
        });
        let upstream;
        try {
            upstream = await this.rag.openChatStream({
                patientId: session.patientId,
                question: dto.question,
            });
        }
        catch (err) {
            const msg = err.message;
            reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
            reply.raw.end();
            return;
        }
        let buffer = '';
        let assistantText = '';
        let sources = null;
        let metrics = null;
        const onClientClose = () => {
            try {
                upstream.destroy?.();
            }
            catch {
            }
        };
        req.raw.on('close', onClientClose);
        try {
            for await (const chunk of upstream) {
                const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
                reply.raw.write(text);
                buffer += text;
                let idx;
                while ((idx = buffer.indexOf('\n\n')) !== -1) {
                    const evt = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    const parsed = this.parseSseEvent(evt);
                    if (!parsed)
                        continue;
                    if (parsed.event === 'sources') {
                        try {
                            sources = JSON.parse(parsed.data);
                        }
                        catch {
                        }
                    }
                    else if (parsed.event === 'metrics') {
                        try {
                            metrics = JSON.parse(parsed.data);
                        }
                        catch {
                        }
                    }
                    else if (parsed.event === 'token' || parsed.event === 'message') {
                        try {
                            const obj = JSON.parse(parsed.data);
                            assistantText += obj.token ?? obj.content ?? '';
                        }
                        catch {
                            assistantText += parsed.data;
                        }
                    }
                    else if (!parsed.event) {
                        try {
                            const value = JSON.parse(parsed.data);
                            assistantText += typeof value === 'string' ? value : parsed.data;
                        }
                        catch {
                            assistantText += parsed.data;
                        }
                    }
                }
            }
        }
        catch (err) {
            reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        }
        finally {
            req.raw.off('close', onClientClose);
            reply.raw.end();
            if (assistantText.trim().length > 0) {
                await this.chat.appendMessage(session.id, 'assistant', assistantText, sources, metrics ?? undefined);
                await this.chat.touchSession(session.id);
            }
        }
    }
    parseSseEvent(raw) {
        const lines = raw.split('\n');
        let event;
        const dataLines = [];
        for (const line of lines) {
            if (line.startsWith('event:'))
                event = line.slice(6).trim();
            else if (line.startsWith('data:'))
                dataLines.push(line.slice(5).trimStart());
        }
        if (dataLines.length === 0)
            return null;
        return { event, data: dataLines.join('\n') };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, chat_dto_1.CreateChatSessionDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id/messages'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('sessions/:id/messages'),
    __param(0, (0, clinic_context_decorator_1.ActiveClinic)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Req)()),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, chat_dto_1.PostMessageDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "postMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, clinic_context_guard_1.ClinicContextGuard),
    (0, common_1.Controller)({ path: 'chat', version: '1' }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        rag_service_1.RagService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map
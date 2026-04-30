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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let ChatService = class ChatService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createSession(clinicId, userId, patientId) {
        const [p] = await this.db
            .select()
            .from(schema_1.patients)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.patients.id, patientId), (0, drizzle_orm_1.eq)(schema_1.patients.clinicId, clinicId)))
            .limit(1);
        if (!p)
            throw new common_1.NotFoundException('Patient not found in active clinic');
        const [session] = await this.db
            .insert(schema_1.chatSessions)
            .values({ clinicId, patientId, userId })
            .returning();
        return session;
    }
    async listSessions(clinicId, userId, patientId) {
        const conds = [(0, drizzle_orm_1.eq)(schema_1.chatSessions.clinicId, clinicId), (0, drizzle_orm_1.eq)(schema_1.chatSessions.userId, userId)];
        if (patientId)
            conds.push((0, drizzle_orm_1.eq)(schema_1.chatSessions.patientId, patientId));
        return this.db
            .select()
            .from(schema_1.chatSessions)
            .where((0, drizzle_orm_1.and)(...conds))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatSessions.createdAt));
    }
    async getSession(clinicId, userId, sessionId) {
        const [s] = await this.db
            .select()
            .from(schema_1.chatSessions)
            .where((0, drizzle_orm_1.eq)(schema_1.chatSessions.id, sessionId))
            .limit(1);
        if (!s)
            throw new common_1.NotFoundException();
        if (s.clinicId !== clinicId || s.userId !== userId)
            throw new common_1.ForbiddenException();
        return s;
    }
    async listMessages(sessionId) {
        return this.db
            .select()
            .from(schema_1.chatMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.chatMessages.sessionId, sessionId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.chatMessages.createdAt));
    }
    async appendMessage(sessionId, role, content, sources, metrics) {
        const [row] = await this.db
            .insert(schema_1.chatMessages)
            .values({
            sessionId,
            role,
            content,
            sources: sources,
            contextRelevance: metrics?.contextRelevance ?? null,
            groundedness: metrics?.groundedness ?? null,
            answerRelevance: metrics?.answerRelevance ?? null,
            metricsPerChunk: (metrics?.perChunk ?? null),
        })
            .returning();
        return row;
    }
    async touchSession(sessionId) {
        await this.db
            .update(schema_1.chatSessions)
            .set({ updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatSessions.id, sessionId));
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], ChatService);
//# sourceMappingURL=chat.service.js.map
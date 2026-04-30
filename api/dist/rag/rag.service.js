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
var RagService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const undici_1 = require("undici");
let RagService = RagService_1 = class RagService {
    logger = new common_1.Logger(RagService_1.name);
    baseUrl;
    token;
    constructor(config) {
        this.baseUrl = (config.get('RAG_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
        this.token = config.get('RAG_AUTH_TOKEN');
    }
    headers(extra = {}) {
        const h = { 'content-type': 'application/json', ...extra };
        if (this.token)
            h['authorization'] = `Bearer ${this.token}`;
        return h;
    }
    async health() {
        try {
            const res = await (0, undici_1.request)(`${this.baseUrl}/v1/health`, {
                method: 'GET',
                headers: this.headers(),
            });
            const body = (await res.body.json());
            return { ok: res.statusCode < 500, ...body };
        }
        catch (err) {
            this.logger.warn(`rag /health unreachable: ${err.message}`);
            return { ok: false };
        }
    }
    async ingest(req) {
        const res = await (0, undici_1.request)(`${this.baseUrl}/v1/ingest`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(req),
        });
        if (res.statusCode >= 400) {
            const text = await res.body.text();
            throw new common_1.ServiceUnavailableException(`rag ingest failed: ${res.statusCode} ${text}`);
        }
        return (await res.body.json());
    }
    async listSources(patientId) {
        const res = await (0, undici_1.request)(`${this.baseUrl}/v1/patients/${encodeURIComponent(patientId)}/sources`, { method: 'GET', headers: this.headers() });
        if (res.statusCode >= 400) {
            const text = await res.body.text();
            throw new common_1.ServiceUnavailableException(`rag listSources failed: ${res.statusCode} ${text}`);
        }
        return (await res.body.json());
    }
    async deletePatientSource(patientId, source) {
        const url = new URL(`${this.baseUrl}/v1/patients/${encodeURIComponent(patientId)}/sources`);
        if (source)
            url.searchParams.set('source', source);
        const res = await (0, undici_1.request)(url.toString(), {
            method: 'DELETE',
            headers: this.headers(),
        });
        if (res.statusCode >= 400) {
            const text = await res.body.text();
            throw new common_1.ServiceUnavailableException(`rag delete failed: ${res.statusCode} ${text}`);
        }
    }
    async openChatStream(req) {
        const res = await (0, undici_1.request)(`${this.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: this.headers({ accept: 'text/event-stream' }),
            body: JSON.stringify(req),
        });
        if (res.statusCode >= 400) {
            const text = await res.body.text();
            throw new common_1.ServiceUnavailableException(`rag chat failed: ${res.statusCode} ${text}`);
        }
        return res.body;
    }
};
exports.RagService = RagService;
exports.RagService = RagService = RagService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RagService);
//# sourceMappingURL=rag.service.js.map
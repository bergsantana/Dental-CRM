"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multipart_1 = __importDefault(require("@fastify/multipart"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const helmet_1 = __importDefault(require("@fastify/helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ trustProxy: true, bodyLimit: 25 * 1024 * 1024 }));
    const config = app.get(config_1.ConfigService);
    const port = Number(config.get('PORT') ?? 4000);
    const origin = config.get('APP_ORIGIN') ?? 'http://localhost:3567';
    await app.register(helmet_1.default, { contentSecurityPolicy: false });
    await app.register(multipart_1.default, {
        limits: { fileSize: 25 * 1024 * 1024, files: 10 },
    });
    app.enableCors({
        origin: [origin],
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    await app.listen(port, '0.0.0.0');
    console.log(`[api] listening on http://0.0.0.0:${port}`);
}
bootstrap().catch((err) => {
    console.error('Fatal startup error', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
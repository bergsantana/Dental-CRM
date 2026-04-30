"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveClinic = void 0;
const common_1 = require("@nestjs/common");
exports.ActiveClinic = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.clinicContext;
});
//# sourceMappingURL=clinic-context.decorator.js.map
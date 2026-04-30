"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAnamnesisDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_anamnesis_dto_1 = require("./create-anamnesis.dto");
class UpdateAnamnesisDto extends (0, mapped_types_1.PartialType)(create_anamnesis_dto_1.CreateAnamnesisDto) {
}
exports.UpdateAnamnesisDto = UpdateAnamnesisDto;
//# sourceMappingURL=update-anamnesis.dto.js.map
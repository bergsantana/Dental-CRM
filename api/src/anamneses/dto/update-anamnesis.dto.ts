import { PartialType } from '@nestjs/mapped-types';
import { CreateAnamnesisDto } from './create-anamnesis.dto';

export class UpdateAnamnesisDto extends PartialType(CreateAnamnesisDto) {}

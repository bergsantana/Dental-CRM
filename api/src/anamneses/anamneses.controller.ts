import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnamnesesService } from './anamneses.service';
import { CreateAnamnesisDto } from './dto/create-anamnesis.dto';
import { UpdateAnamnesisDto } from './dto/update-anamnesis.dto';

@UseGuards(JwtAuthGuard, ClinicContextGuard)
@Controller({ version: '1' })
export class AnamnesesController {
  constructor(private readonly anamneses: AnamnesesService) {}

  @Get('patients/:patientId/anamneses')
  list(
    @ActiveClinic() ctx: ClinicContext,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.anamneses.listForPatient(ctx.clinicId, patientId);
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist')
  @Post('patients/:patientId/anamneses')
  create(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateAnamnesisDto,
  ) {
    return this.anamneses.create(ctx.clinicId, patientId, user.userId, dto);
  }

  @Get('anamneses/:id')
  get(
    @ActiveClinic() ctx: ClinicContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.anamneses.get(ctx.clinicId, id);
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist')
  @Patch('anamneses/:id')
  update(
    @ActiveClinic() ctx: ClinicContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnamnesisDto,
  ) {
    return this.anamneses.update(ctx.clinicId, id, dto);
  }
}

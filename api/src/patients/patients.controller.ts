import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@UseGuards(JwtAuthGuard, ClinicContextGuard)
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  list(
    @ActiveClinic() ctx: ClinicContext,
    @Query('search') search?: string,
    @Query('specialty') specialty?: string,
  ) {
    return this.patients.list(ctx.clinicId, { search, specialty });
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Post()
  create(@ActiveClinic() ctx: ClinicContext, @Body() dto: CreatePatientDto) {
    return this.patients.create(ctx.clinicId, dto);
  }

  @Get(':id')
  get(@ActiveClinic() ctx: ClinicContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.patients.getOrThrow(ctx.clinicId, id);
  }

  @Get(':id/timeline')
  timeline(
    @ActiveClinic() ctx: ClinicContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.patients.timeline(ctx.clinicId, id);
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Patch(':id')
  update(
    @ActiveClinic() ctx: ClinicContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patients.update(ctx.clinicId, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('owner')
  @Delete(':id')
  remove(@ActiveClinic() ctx: ClinicContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.patients.softDelete(ctx.clinicId, id);
  }
}

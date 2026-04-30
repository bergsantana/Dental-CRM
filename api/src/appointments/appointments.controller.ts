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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @UseGuards(ClinicContextGuard)
  @Get('appointments')
  list(
    @ActiveClinic() ctx: ClinicContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('dentistId') dentistId?: string,
  ) {
    return this.appointments.listForClinic(ctx.clinicId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      dentistId,
    });
  }

  /** "Minha agenda" — every clinic where the current user is a dentist. */
  @Get('me/appointments')
  myAppointments(
    @CurrentUser() user: { userId: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointments.listForDentist(user.userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @UseGuards(ClinicContextGuard)
  @Get('appointments/:id')
  get(
    @ActiveClinic() ctx: ClinicContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointments.getById(ctx.clinicId, id);
  }

  @UseGuards(ClinicContextGuard)
  @Get('patients/:patientId/appointments')
  listForPatient(
    @ActiveClinic() ctx: ClinicContext,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('upcoming') upcoming?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.appointments.listForPatient(ctx.clinicId, patientId, {
      upcoming: upcoming === 'true',
      limit: limit ? Math.max(1, Math.min(100, Number(limit))) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Post('appointments')
  create(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointments.create(ctx.clinicId, user.userId, dto);
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Patch('appointments/:id')
  update(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(ctx.clinicId, user.userId, ctx.role, id, dto);
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Delete('appointments/:id')
  cancel(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.cancel(ctx.clinicId, user.userId, ctx.role, id, dto?.reason);
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Post('appointments/:id/approve')
  approve(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointments.approve(ctx.clinicId, user.userId, ctx.role, id);
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Post('appointments/:id/reject')
  reject(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.reject(ctx.clinicId, user.userId, ctx.role, id, dto?.reason);
  }
}

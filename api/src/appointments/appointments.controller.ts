import {
  Body,
  Controller,
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

  @UseGuards(ClinicContextGuard)
  @Patch('appointments/:id')
  update(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(ctx.clinicId, user.userId, ctx.role, id, dto);
  }
}

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BookingService } from './booking.service';
import { CreateBookingTokenDto, SubmitBookingDto } from './dto/booking.dto';

@Controller({ version: '1' })
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  /** Staff: create a single-use booking link for a patient. */
  @UseGuards(JwtAuthGuard, ClinicContextGuard, RolesGuard)
  @Roles('owner', 'dentist', 'receptionist')
  @Post('clinics/:clinicId/patients/:patientId/booking-tokens')
  createToken(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateBookingTokenDto,
  ) {
    // Path clinicId must match the active-clinic header (defense in depth).
    if (clinicId !== ctx.clinicId) {
      throw new ForbiddenException('clinicId path param does not match active clinic');
    }
    return this.booking.createToken(ctx.clinicId, patientId, user.userId, dto?.ttlMinutes);
  }

  /** Public: read the booking page payload (no auth, no clinic header). */
  @Public()
  @Get('public/booking/:token')
  getPublic(@Param('token') token: string) {
    return this.booking.getPublic(token);
  }

  /** Public: submit a booking request (creates appointment in 'requested'). */
  @Public()
  @Post('public/booking/:token')
  submit(@Param('token') token: string, @Body() dto: SubmitBookingDto) {
    return this.booking.submit(token, dto);
  }
}

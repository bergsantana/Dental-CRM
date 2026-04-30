import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  @Get('clinics')
  list(@CurrentUser() user: { userId: string }) {
    return this.clinics.listForUser(user.userId);
  }

  @Post('clinics')
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateClinicDto) {
    return this.clinics.create(user.userId, dto);
  }

  @UseGuards(ClinicContextGuard)
  @Get('clinics/current/members')
  listMembers(@ActiveClinic() ctx: ClinicContext) {
    return this.clinics.listMembers(ctx.clinicId);
  }

  @UseGuards(ClinicContextGuard)
  @Get('clinics/current/dentists')
  listDentists(@ActiveClinic() ctx: ClinicContext) {
    return this.clinics.listDentists(ctx.clinicId);
  }

  @UseGuards(ClinicContextGuard, RolesGuard)
  @Roles('owner')
  @Post('clinics/current/members/invite')
  invite(@ActiveClinic() ctx: ClinicContext, @Body() dto: InviteMemberDto) {
    return this.clinics.invite(ctx.clinicId, dto);
  }

  @Get('invitations')
  listInvitations(@CurrentUser() user: { userId: string }) {
    return this.clinics.listInvitations(user.userId);
  }

  @Post('invitations/:id/accept')
  accept(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinics.respondInvitation(user.userId, id, true);
  }

  @Post('invitations/:id/decline')
  decline(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clinics.respondInvitation(user.userId, id, false);
  }
}

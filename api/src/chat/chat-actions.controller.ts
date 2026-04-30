import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ActiveClinic,
  type ClinicContext,
} from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatActionsService } from './chat-actions.service';
import { ChatActionDto } from './dto/chat-action.dto';

@UseGuards(JwtAuthGuard, ClinicContextGuard)
@Controller({ path: 'chat', version: '1' })
export class ChatActionsController {
  constructor(
    private readonly chat: ChatService,
    private readonly actions: ChatActionsService,
  ) {}

  @Post('sessions/:id/actions')
  async runAction(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: ChatActionDto,
  ) {
    const session = await this.chat.getSession(
      ctx.clinicId,
      user.userId,
      sessionId,
    );
    return this.actions.run(
      {
        clinicId: ctx.clinicId,
        userId: user.userId,
        role: ctx.role,
        sessionId: session.id,
        patientId: session.patientId,
      },
      dto,
    );
  }
}

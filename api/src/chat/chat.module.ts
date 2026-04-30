import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { RagModule } from '../rag/rag.module';
import { ChatActionsController } from './chat-actions.controller';
import { ChatActionsService } from './chat-actions.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RagModule, AppointmentsModule],
  providers: [ChatService, ChatActionsService],
  controllers: [ChatController, ChatActionsController],
})
export class ChatModule {}

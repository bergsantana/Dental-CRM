import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RagModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}

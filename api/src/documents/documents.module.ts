import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [RagModule],
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}

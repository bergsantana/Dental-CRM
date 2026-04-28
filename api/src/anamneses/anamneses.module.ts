import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { AnamnesesController } from './anamneses.controller';
import { AnamnesesService } from './anamneses.service';

@Module({
  imports: [RagModule],
  providers: [AnamnesesService],
  controllers: [AnamnesesController],
})
export class AnamnesesModule {}

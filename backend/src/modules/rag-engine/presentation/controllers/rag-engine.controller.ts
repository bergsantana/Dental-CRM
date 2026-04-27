import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestDocumentUseCase } from '../application/use-cases/ingest-document/ingest-document.use-case';
import { IngestDocumentInput } from '../application/use-cases/ingest-document/ingest-document.input';

@Controller('rag-engine')
export class RagEngineController {
  constructor(
    @Inject(IngestDocumentUseCase)
    private readonly ingestDocumentUseCase: IngestDocumentUseCase,
  ) {}

  @Post('ingest')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('file'))
  async ingestDocument(
    @Body('patientId') patientId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('File not provided');
    }

    const input: IngestDocumentInput = {
      patientId,
      file: file.buffer,
    };
    await this.ingestDocumentUseCase.execute(input);
  }
}

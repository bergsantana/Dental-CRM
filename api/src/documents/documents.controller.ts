import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DocumentsService, type UploadedFile } from './documents.service';

@UseGuards(JwtAuthGuard, ClinicContextGuard)
@Controller({ version: '1' })
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('patients/:patientId/documents')
  list(
    @ActiveClinic() ctx: ClinicContext,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.documents.list(ctx.clinicId, patientId);
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist', 'assistant')
  @Post('patients/:patientId/documents')
  async upload(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Req() req: FastifyRequest,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Expected multipart/form-data');
    }
    const collected: UploadedFile[] = [];
    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        collected.push({
          filename: part.filename,
          mime: part.mimetype,
          buffer,
        });
      }
    }
    return this.documents.upload(ctx.clinicId, patientId, user.userId, collected);
  }

  @UseGuards(RolesGuard)
  @Roles('owner', 'dentist')
  @Delete('patients/:patientId/documents/:documentId')
  remove(
    @ActiveClinic() ctx: ClinicContext,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.documents.remove(ctx.clinicId, patientId, documentId);
  }
}

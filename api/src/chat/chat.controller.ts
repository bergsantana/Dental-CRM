import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ActiveClinic, type ClinicContext } from '../common/decorators/clinic-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClinicContextGuard } from '../common/guards/clinic-context.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RagService } from '../rag/rag.service';
import { ChatService } from './chat.service';
import { CreateChatSessionDto, PostMessageDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard, ClinicContextGuard)
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly rag: RagService,
  ) {}

  @Get('health')
  health() {
    return this.rag.health();
  }

  @Post('sessions')
  createSession(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateChatSessionDto,
  ) {
    return this.chat.createSession(ctx.clinicId, user.userId, dto.patientId);
  }

  @Get('sessions')
  listSessions(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Query('patientId') patientId?: string,
  ) {
    return this.chat.listSessions(ctx.clinicId, user.userId, patientId);
  }

  @Get('sessions/:id/messages')
  async listMessages(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.chat.getSession(ctx.clinicId, user.userId, id);
    return this.chat.listMessages(id);
  }

  /**
   * Streams a chat answer. Persists the user message before opening the
   * upstream stream, accumulates tokens, then persists the assistant
   * message + sources when the upstream stream emits `event: done`.
   */
  @Post('sessions/:id/messages')
  async postMessage(
    @ActiveClinic() ctx: ClinicContext,
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostMessageDto,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const session = await this.chat.getSession(ctx.clinicId, user.userId, id);
    await this.chat.appendMessage(session.id, 'user', dto.question);

    // `reply.raw.writeHead` bypasses Fastify's CORS hook, so we set the
    // Access-Control-* headers manually based on the request origin.
    const origin = req.headers.origin;
    const corsHeaders: Record<string, string> = {};
    if (typeof origin === 'string' && origin.length > 0) {
      corsHeaders['access-control-allow-origin'] = origin;
      corsHeaders['access-control-allow-credentials'] = 'true';
      corsHeaders['vary'] = 'Origin';
    }

    reply.raw.writeHead(200, {
      ...corsHeaders,
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    });

    let upstream;
    try {
      upstream = await this.rag.openChatStream({
        patientId: session.patientId,
        question: dto.question,
      });
    } catch (err) {
      const msg = (err as Error).message;
      reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
      reply.raw.end();
      return;
    }

    let buffer = '';
    let assistantText = '';
    let sources: unknown = null;
    let metrics: {
      contextRelevance?: number | null;
      groundedness?: number | null;
      answerRelevance?: number | null;
      perChunk?: number[] | null;
    } | null = null;

    const onClientClose = () => {
      try {
        (upstream as { destroy?: () => void }).destroy?.();
      } catch {
        /* noop */
      }
    };
    req.raw.on('close', onClientClose);

    try {
      for await (const chunk of upstream as AsyncIterable<Buffer | string>) {
        const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
        reply.raw.write(text);

        // Parse SSE events to capture tokens + sources for persistence.
        buffer += text;
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const evt = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const parsed = this.parseSseEvent(evt);
          if (!parsed) continue;
          if (parsed.event === 'sources') {
            try {
              sources = JSON.parse(parsed.data);
            } catch {
              /* ignore */
            }
          } else if (parsed.event === 'metrics') {
            try {
              metrics = JSON.parse(parsed.data);
            } catch {
              /* ignore */
            }
          } else if (parsed.event === 'token' || parsed.event === 'message') {
            try {
              const obj = JSON.parse(parsed.data) as { token?: string; content?: string };
              assistantText += obj.token ?? obj.content ?? '';
            } catch {
              assistantText += parsed.data;
            }
          } else if (!parsed.event) {
            // Default `data:` line — the upstream sends JSON-stringified
            // tokens (e.g. `data: "Yes"`). Try to parse so we store the
            // raw token text without the surrounding quotes; fall back to
            // the raw data if it isn't valid JSON.
            try {
              const value = JSON.parse(parsed.data);
              assistantText += typeof value === 'string' ? value : parsed.data;
            } catch {
              assistantText += parsed.data;
            }
          }
        }
      }
    } catch (err) {
      reply.raw.write(
        `event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`,
      );
    } finally {
      req.raw.off('close', onClientClose);
      reply.raw.end();
      if (assistantText.trim().length > 0) {
        await this.chat.appendMessage(
          session.id,
          'assistant',
          assistantText,
          sources,
          metrics ?? undefined,
        );
        await this.chat.touchSession(session.id);
      }
    }
  }

  private parseSseEvent(raw: string): { event?: string; data: string } | null {
    const lines = raw.split('\n');
    let event: string | undefined;
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) return null;
    return { event, data: dataLines.join('\n') };
  }
}

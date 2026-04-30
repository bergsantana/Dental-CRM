import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import {
  AppointmentStatus,
  isTerminalStatus,
} from '../appointments/status-machine';
import { ChatService } from './chat.service';
import type {
  ChatActionArgsDto,
  ChatActionDto,
  ChatActionKind,
} from './dto/chat-action.dto';

interface ActionContext {
  clinicId: string;
  userId: string;
  role: 'owner' | 'dentist' | 'assistant' | 'receptionist';
  sessionId: string;
  patientId: string;
}

export interface ChatActionResult {
  ok: true;
  kind: ChatActionKind;
  mode: 'preview' | 'commit';
  /** Human-readable summary in PT-BR, suitable for chat display. */
  message: string;
  /** Mode-specific payload returned to the FE. */
  data?: unknown;
}

@Injectable()
export class ChatActionsService {
  constructor(
    private readonly chat: ChatService,
    private readonly appointments: AppointmentsService,
  ) {}

  async run(ctx: ActionContext, dto: ChatActionDto): Promise<ChatActionResult> {
    const args = dto.args ?? {};
    switch (dto.kind) {
      case 'list_upcoming':
        return this.listUpcoming(ctx, dto.mode, args);
      case 'create':
        return this.create(ctx, dto.mode, args);
      case 'reschedule':
        return this.reschedule(ctx, dto.mode, args);
      case 'cancel':
        return this.cancel(ctx, dto.mode, args);
      case 'approve':
        return this.approve(ctx, dto.mode, args);
      case 'reject':
        return this.reject(ctx, dto.mode, args);
      default:
        throw new BadRequestException(`Tipo de ação desconhecido`);
    }
  }

  // ---------- Helpers ----------

  private fmtDateTime(d: Date): string {
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private async loadAppointment(ctx: ActionContext, id: string) {
    const appt = await this.appointments.getById(ctx.clinicId, id);
    if (appt.patientId !== ctx.patientId) {
      throw new BadRequestException(
        'Este agendamento não pertence ao paciente da sessão.',
      );
    }
    return appt;
  }

  private async persistAssistantMessage(
    ctx: ActionContext,
    text: string,
    metadata: Record<string, unknown>,
  ) {
    await this.chat.appendMessage(
      ctx.sessionId,
      'assistant',
      text,
      metadata,
      undefined,
    );
    await this.chat.touchSession(ctx.sessionId);
  }

  // ---------- Actions ----------

  private async listUpcoming(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    const list = await this.appointments.listForPatient(
      ctx.clinicId,
      ctx.patientId,
      { upcoming: true, limit: args.limit ?? 5 },
    );
    const lines =
      list.length === 0
        ? 'Nenhum agendamento futuro para este paciente.'
        : list
            .map(
              (a) =>
                `• ${this.fmtDateTime(a.startsAt)} — status: ${a.status}${
                  a.reason ? ` (${a.reason})` : ''
                }`,
            )
            .join('\n');
    const message = `Próximos agendamentos:\n${lines}`;
    if (mode === 'commit') {
      await this.persistAssistantMessage(ctx, message, {
        action: { kind: 'list_upcoming', count: list.length },
      });
    }
    return { ok: true, kind: 'list_upcoming', mode, message, data: list };
  }

  private async create(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    if (!args.dentistId || !args.startsAt || !args.durationMinutes) {
      throw new BadRequestException(
        'Para criar um agendamento informe dentistId, startsAt e durationMinutes.',
      );
    }
    const startsAt = new Date(args.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('startsAt inválido');
    }
    const endsAt = new Date(startsAt.getTime() + args.durationMinutes * 60_000);

    if (mode === 'preview') {
      const overlap = await this.appointments.findOverlap(
        args.dentistId,
        startsAt,
        endsAt,
      );
      const summary = `Criar agendamento em ${this.fmtDateTime(startsAt)} (${args.durationMinutes} min)${
        args.reason ? ` — motivo: ${args.reason}` : ''
      }.`;
      return {
        ok: true,
        kind: 'create',
        mode,
        message: overlap
          ? `${summary}\nAtenção: conflita com outro agendamento (${this.fmtDateTime(
              overlap.startsAt,
            )}–${this.fmtDateTime(overlap.endsAt)}).`
          : summary,
        data: {
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          dentistId: args.dentistId,
          patientId: ctx.patientId,
          reason: args.reason,
          conflict: overlap ?? null,
        },
      };
    }

    const created = await this.appointments.create(ctx.clinicId, ctx.userId, {
      patientId: ctx.patientId,
      dentistId: args.dentistId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      reason: args.reason,
    });
    const message = `Agendamento criado para ${this.fmtDateTime(created.startsAt)}.`;
    await this.persistAssistantMessage(ctx, message, {
      action: { kind: 'create', appointmentId: created.id },
    });
    return { ok: true, kind: 'create', mode, message, data: created };
  }

  private async reschedule(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    if (!args.appointmentId || !args.startsAt) {
      throw new BadRequestException(
        'Para remarcar informe appointmentId e startsAt.',
      );
    }
    const existing = await this.loadAppointment(ctx, args.appointmentId);
    const startsAt = new Date(args.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('startsAt inválido');
    }
    const duration =
      args.durationMinutes ??
      Math.max(
        5,
        Math.round(
          (existing.endsAt.getTime() - existing.startsAt.getTime()) / 60_000,
        ),
      );
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    if (isTerminalStatus(existing.status as AppointmentStatus)) {
      throw new ConflictException(
        `Não é possível remarcar agendamento em status '${existing.status}'.`,
      );
    }

    if (mode === 'preview') {
      const overlap = await this.appointments.findOverlap(
        existing.dentistId,
        startsAt,
        endsAt,
        existing.id,
      );
      const summary = `Remarcar de ${this.fmtDateTime(existing.startsAt)} para ${this.fmtDateTime(startsAt)} (${duration} min).`;
      return {
        ok: true,
        kind: 'reschedule',
        mode,
        message: overlap
          ? `${summary}\nAtenção: conflita com outro agendamento (${this.fmtDateTime(
              overlap.startsAt,
            )}–${this.fmtDateTime(overlap.endsAt)}).`
          : summary,
        data: {
          previous: {
            startsAt: existing.startsAt.toISOString(),
            endsAt: existing.endsAt.toISOString(),
          },
          next: {
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
          },
          conflict: overlap ?? null,
        },
      };
    }

    const updated = await this.appointments.update(
      ctx.clinicId,
      ctx.userId,
      ctx.role as 'owner' | 'dentist' | 'receptionist',
      existing.id,
      {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
    );
    const message = `Agendamento remarcado para ${this.fmtDateTime(updated.startsAt)}.`;
    await this.persistAssistantMessage(ctx, message, {
      action: { kind: 'reschedule', appointmentId: updated.id },
    });
    return { ok: true, kind: 'reschedule', mode, message, data: updated };
  }

  private async cancel(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    if (!args.appointmentId) {
      throw new BadRequestException('Para cancelar informe appointmentId.');
    }
    const existing = await this.loadAppointment(ctx, args.appointmentId);

    if (mode === 'preview') {
      if (existing.status === 'cancelled') {
        return {
          ok: true,
          kind: 'cancel',
          mode,
          message: 'Este agendamento já está cancelado.',
          data: existing,
        };
      }
      return {
        ok: true,
        kind: 'cancel',
        mode,
        message: `Cancelar agendamento de ${this.fmtDateTime(existing.startsAt)}${
          args.reason ? ` — motivo: ${args.reason}` : ''
        }.`,
        data: existing,
      };
    }

    const cancelled = await this.appointments.cancel(
      ctx.clinicId,
      ctx.userId,
      ctx.role as 'owner' | 'dentist' | 'receptionist',
      existing.id,
      args.reason,
    );
    const message = `Agendamento de ${this.fmtDateTime(cancelled.startsAt)} foi cancelado.`;
    await this.persistAssistantMessage(ctx, message, {
      action: { kind: 'cancel', appointmentId: cancelled.id },
    });
    return { ok: true, kind: 'cancel', mode, message, data: cancelled };
  }

  private async approve(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    if (!args.appointmentId) {
      throw new BadRequestException('Para confirmar informe appointmentId.');
    }
    const existing = await this.loadAppointment(ctx, args.appointmentId);
    if (existing.status !== 'requested') {
      throw new ConflictException(
        `Apenas solicitações pendentes podem ser confirmadas (status atual: '${existing.status}').`,
      );
    }
    if (mode === 'preview') {
      return {
        ok: true,
        kind: 'approve',
        mode,
        message: `Confirmar solicitação de ${this.fmtDateTime(existing.startsAt)}.`,
        data: existing,
      };
    }
    const approved = await this.appointments.approve(
      ctx.clinicId,
      ctx.userId,
      ctx.role as 'owner' | 'dentist' | 'receptionist',
      existing.id,
    );
    const message = `Solicitação de ${this.fmtDateTime(approved.startsAt)} foi confirmada.`;
    await this.persistAssistantMessage(ctx, message, {
      action: { kind: 'approve', appointmentId: approved.id },
    });
    return { ok: true, kind: 'approve', mode, message, data: approved };
  }

  private async reject(
    ctx: ActionContext,
    mode: 'preview' | 'commit',
    args: ChatActionArgsDto,
  ): Promise<ChatActionResult> {
    if (!args.appointmentId) {
      throw new BadRequestException('Para recusar informe appointmentId.');
    }
    const existing = await this.loadAppointment(ctx, args.appointmentId);
    if (existing.status !== 'requested') {
      throw new ConflictException(
        `Apenas solicitações pendentes podem ser recusadas (status atual: '${existing.status}').`,
      );
    }
    if (mode === 'preview') {
      return {
        ok: true,
        kind: 'reject',
        mode,
        message: `Recusar solicitação de ${this.fmtDateTime(existing.startsAt)}${
          args.reason ? ` — motivo: ${args.reason}` : ''
        }.`,
        data: existing,
      };
    }
    const rejected = await this.appointments.reject(
      ctx.clinicId,
      ctx.userId,
      ctx.role as 'owner' | 'dentist' | 'receptionist',
      existing.id,
      args.reason,
    );
    const message = `Solicitação de ${this.fmtDateTime(rejected.startsAt)} foi recusada.`;
    await this.persistAssistantMessage(ctx, message, {
      action: { kind: 'reject', appointmentId: rejected.id },
    });
    return { ok: true, kind: 'reject', mode, message, data: rejected };
  }
}

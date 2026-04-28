import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module';
import { chatMessages, chatSessions, patients } from '../db/schema';

@Injectable()
export class ChatService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async createSession(clinicId: string, userId: string, patientId: string) {
    const [p] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinicId, clinicId)))
      .limit(1);
    if (!p) throw new NotFoundException('Patient not found in active clinic');

    const [session] = await this.db
      .insert(chatSessions)
      .values({ clinicId, patientId, userId })
      .returning();
    return session;
  }

  async listSessions(clinicId: string, userId: string, patientId?: string) {
    const conds = [eq(chatSessions.clinicId, clinicId), eq(chatSessions.userId, userId)];
    if (patientId) conds.push(eq(chatSessions.patientId, patientId));
    return this.db
      .select()
      .from(chatSessions)
      .where(and(...conds))
      .orderBy(desc(chatSessions.createdAt));
  }

  async getSession(clinicId: string, userId: string, sessionId: string) {
    const [s] = await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);
    if (!s) throw new NotFoundException();
    if (s.clinicId !== clinicId || s.userId !== userId) throw new ForbiddenException();
    return s;
  }

  async listMessages(sessionId: string) {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async appendMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: unknown,
    metrics?: {
      contextRelevance?: number | null;
      groundedness?: number | null;
      answerRelevance?: number | null;
      perChunk?: number[] | null;
    },
  ) {
    const [row] = await this.db
      .insert(chatMessages)
      .values({
        sessionId,
        role,
        content,
        sources: sources as never,
        contextRelevance: metrics?.contextRelevance ?? null,
        groundedness: metrics?.groundedness ?? null,
        answerRelevance: metrics?.answerRelevance ?? null,
        metricsPerChunk: (metrics?.perChunk ?? null) as never,
      })
      .returning();
    return row;
  }

  async touchSession(sessionId: string) {
    await this.db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }
}

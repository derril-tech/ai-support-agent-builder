import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from './message.entity';
import { messagesCounter } from '../metrics/counters';
import { PlanService } from '../plan/plan.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationsRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messagesRepo: Repository<MessageEntity>,
    private readonly plan: PlanService,
  ) {}

  async list(cursor?: string, limit?: number) {
    const take = limit ?? 20;
    const skip = cursor ? parseInt(cursor, 10) : 0;
    const [items, total] = await this.conversationsRepo.findAndCount({ skip, take, order: { createdAt: 'DESC' } });
    const nextCursor = skip + take < total ? String(skip + take) : null;
    return { items, nextCursor };
  }

  async create(input: { channel: string; externalThreadId?: string | null }) {
    this.plan.enforce('org-stub', 'conversation:create');
    const entity = this.conversationsRepo.create({ channel: input.channel, externalThreadId: input.externalThreadId ?? null, status: 'active' });
    return await this.conversationsRepo.save(entity);
  }

  async get(id: string) {
    return await this.conversationsRepo.findOne({ where: { id } });
  }

  async postMessage(conversationId: string, body: { role: 'user'|'assistant'|'system'; content: string; citations?: unknown[]; toolCalls?: unknown[]; toolResults?: unknown[]; costUsd?: number; latencyMs?: number | null }) {
    this.plan.enforce('org-stub', 'message:create');
    const conversation = await this.conversationsRepo.findOneByOrFail({ id: conversationId });
    const msg = this.messagesRepo.create({ conversation, role: body.role, content: body.content, citations: body.citations ?? [], toolCalls: body.toolCalls ?? [], toolResults: body.toolResults ?? [], costUsd: body.costUsd ?? 0, latencyMs: body.latencyMs ?? null });
    const saved = await this.messagesRepo.save(msg);
    messagesCounter.labels(body.role, conversation.channel).inc();
    return saved;
  }

  async listMessages(conversationId: string) {
    return { items: await this.messagesRepo.find({ where: { conversation: { id: conversationId } as any }, order: { createdAt: 'ASC' } }) };
  }

  async mapExternal(id: string, provider: string, threadId: string) {
    await this.conversationsRepo.update({ id }, { externalThreadId: threadId });
    return { id, provider, externalThreadId: threadId };
  }
}

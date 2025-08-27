import { Body, Controller, Get, Param, Post, Query, Sse } from '@nestjs/common';
import { interval, map } from 'rxjs';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly svc: ConversationsService) {}

  @Get()
  list(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.svc.list(cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Post()
  create(@Body() body: { externalThreadId?: string; channel?: string }) {
    return this.svc.create({ channel: body.channel ?? 'web', externalThreadId: body.externalThreadId });
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Sse(':id/stream')
  stream(@Param('id') id: string) {
    return interval(1000).pipe(map((i) => ({ event: 'token', data: { conversationId: id, token: `token-${i}` } })));
  }

  @Post(':id/messages')
  postMessage(
    @Param('id') id: string,
    @Body() body: { role: 'user'|'assistant'|'system'; content: string; citations?: any[]; toolCalls?: any[]; toolResults?: any[]; costUsd?: number; latencyMs?: number },
  ) {
    return this.svc.postMessage(id, body);
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string) { return this.svc.listMessages(id); }

  @Post(':id/external')
  mapExternal(@Param('id') id: string, @Body() body: { provider: string; threadId: string }) {
    return this.svc.mapExternal(id, body.provider, body.threadId);
  }

  @Post(':id/escalate')
  escalate(@Param('id') id: string, @Body() body: { channel: 'zendesk'|'intercom'|'jira'|'email' }) {
    return { id, escalatedTo: body.channel, status: 'in_handoff' };
  }

  @Post(':id/wrapup')
  wrapup(@Param('id') id: string, @Body() body: { summary?: string }) {
    return { id, wrappedUp: true, summary: body.summary ?? null };
  }

  @Post(':id/csat')
  submitCsat(@Param('id') id: string, @Body() body: { rating: number; feedback?: string }) {
    return { id, rating: body.rating, feedback: body.feedback };
  }
}

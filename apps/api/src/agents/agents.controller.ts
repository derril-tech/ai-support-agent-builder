import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.record(z.any()).default({}),
});

@Controller('agents')
export class AgentsController {
  @Get()
  list() {
    return { items: [], nextCursor: null };
  }

  @Post()
  create(@Body(new ZodValidationPipe(createAgentSchema)) body: z.infer<typeof createAgentSchema>) {
    return { id: 'agent-id-stub', version: 1, status: 'draft', ...body };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return { id, name: 'Agent', version: 1, status: 'draft', config: {} };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, ...body };
  }

  @Post(':id/versions')
  release(@Param('id') id: string, @Body() body: { status?: 'released' | 'archived' }) {
    const nextVersion = 2; // stubbed
    return { id, version: nextVersion, status: body?.status ?? 'released' };
  }

  @Get(':id/diff')
  diff(@Param('id') id: string, @Query('from') from: string, @Query('to') to: string) {
    return { id, from, to, diff: [{ path: 'config.prompt', before: 'old', after: 'new' }] };
  }
}

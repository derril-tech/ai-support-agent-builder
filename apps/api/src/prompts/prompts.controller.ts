import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const promptVariantSchema = z.object({ channel: z.enum(['web','slack','teams','intercom','zendesk','sms','email','voice']), template: z.string() });

@Controller('prompts')
export class PromptsController {
  @Get()
  list() { return { items: [], nextCursor: null }; }

  @Post()
  create(@Body(new ZodValidationPipe(promptVariantSchema)) body: z.infer<typeof promptVariantSchema>) { return { id: 'prompt-id-stub', ...body }; }

  @Get(':id')
  get(@Param('id') id: string) { return { id, channel: 'web', template: 'You are helpful' }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }
}

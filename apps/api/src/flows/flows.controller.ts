import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const flowSchema = z.object({ name: z.string(), steps: z.array(z.any()) });

@Controller('flows')
export class FlowsController {
  @Get()
  list() { return { items: [], nextCursor: null }; }

  @Post()
  create(@Body(new ZodValidationPipe(flowSchema)) body: z.infer<typeof flowSchema>) { return { id: 'flow-id-stub', ...body }; }

  @Get(':id')
  get(@Param('id') id: string) { return { id, name: 'Default', steps: [] }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }
}

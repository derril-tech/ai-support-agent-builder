import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const deploymentSchema = z.object({ agentId: z.string(), name: z.string(), channel: z.string(), config: z.record(z.any()).default({}) });

@Controller('deployments')
export class DeploymentsController {
  @Get()
  list() { return { items: [] }; }

  @Post()
  create(@Body(new ZodValidationPipe(deploymentSchema)) body: z.infer<typeof deploymentSchema>) { return { id: 'dep-id-stub', status: 'inactive', ...body }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }

  @Post(':id/shadow/enable')
  enableShadow(@Param('id') id: string) { return { id, shadow: true }; }

  @Post(':id/shadow/disable')
  disableShadow(@Param('id') id: string) { return { id, shadow: false }; }
}

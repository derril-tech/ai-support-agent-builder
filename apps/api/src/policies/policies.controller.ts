import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const policySchema = z.object({
  jailbreakDetection: z.boolean(),
  piiFilter: z.boolean(),
  profanityFilter: z.boolean(),
  selfHarmRouting: z.boolean(),
  style: z.enum(['formal', 'concise', 'friendly']),
  forbiddenClaims: z.array(z.string()),
  enforceStrictCitations: z.boolean().default(true)
});

@Controller('policies')
export class PoliciesController {
  @Get()
  list() { return { items: [], nextCursor: null }; }

  @Post()
  create(@Body(new ZodValidationPipe(policySchema)) body: z.infer<typeof policySchema>) { return { id: 'policy-id-stub', ...body }; }

  @Get(':id')
  get(@Param('id') id: string) { return { id, jailbreakDetection: true, piiFilter: true, profanityFilter: true, selfHarmRouting: true, style: 'friendly', forbiddenClaims: [], enforceStrictCitations: true }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }
}

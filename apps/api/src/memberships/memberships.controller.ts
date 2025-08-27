import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createMembershipSchema = z.object({ organization_id: z.string().uuid().optional(), user_id: z.string().uuid().optional(), role: z.string() });

@Controller('memberships')
export class MembershipsController {
  @Get()
  list() { return { items: [], nextCursor: null }; }

  @Post()
  create(@Body(new ZodValidationPipe(createMembershipSchema)) body: z.infer<typeof createMembershipSchema>) {
    return { id: 'membership-id-stub', ...body };
  }

  @Get(':id')
  get(@Param('id') id: string) { return { id, user_id: 'user-id-stub', organization_id: 'org-id-stub', role: 'viewer' }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }
}


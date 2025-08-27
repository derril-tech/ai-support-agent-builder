import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { paginateArray, Paginated } from '../common/pagination';

const createOrgSchema = z.object({ name: z.string().min(1), slug: z.string().min(1) });

@Controller('organizations')
export class OrganizationsController {
  @Get()
  list(@Query('cursor') cursor?: string, @Query('limit') limit?: string): Paginated<any> {
    const items = [] as any[];
    return paginateArray(items, { cursor, limit: limit ? parseInt(limit, 10) : undefined });
  }

  @Post()
  create(@Body(new ZodValidationPipe(createOrgSchema)) body: z.infer<typeof createOrgSchema>) {
    return { id: 'org-id-stub', ...body };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return { id, name: 'Org', slug: 'org' };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id, ...body };
  }
}

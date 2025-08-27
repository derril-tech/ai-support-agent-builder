import { Body, Controller, Get, Param, Put } from '@nestjs/common';

@Controller('budgets')
export class BudgetsController {
  @Get(':orgId')
  get(@Param('orgId') orgId: string) {
    return { orgId, monthlyUsd: 100.0, perChannel: {}, rateLimits: { perMinute: 60 } };
  }

  @Put(':orgId')
  update(
    @Param('orgId') orgId: string,
    @Body() body: { monthlyUsd?: number; perChannel?: Record<string, any>; rateLimits?: { perMinute?: number } },
  ) {
    return { orgId, updated: true, ...body };
  }
}

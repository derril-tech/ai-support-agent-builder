import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('analytics')
export class AnalyticsController {
  @Get('kpis')
  kpis() { return { deflection: 0.35, fcr: 0.65, csat: 4.3 }; }

  @Post('timeseries')
  timeseries(@Body() body: { metric: string; from: string; to: string; granularity: 'hour'|'day' }) {
    return { metric: body.metric, points: [] };
  }

  @Get('anomalies')
  anomalies() { return { anomalies: [] }; }

  @Get('costs')
  costs() { return { perProvider: [], perTool: [] }; }
}

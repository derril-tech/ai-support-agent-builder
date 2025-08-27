import { Body, Controller, Get, Put } from '@nestjs/common';

@Controller('routing')
export class RoutingController {
  @Get('rules')
  getRules() {
    return {
      businessHours: { timezone: 'UTC', open: '09:00', close: '17:00', days: [1,2,3,4,5] },
      queues: [{ name: 'default', concurrency: 10 }],
      vipEmails: [],
      language: { default: 'en', supported: ['en','es','fr'] },
    };
  }

  @Put('rules')
  updateRules(
    @Body()
    body: {
      businessHours?: any; queues?: any[]; vipEmails?: string[]; language?: any;
    },
  ) {
    return { updated: true, rules: body };
  }
}


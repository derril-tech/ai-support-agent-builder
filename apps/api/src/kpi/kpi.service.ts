import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KpiService {
  @Cron(CronExpression.EVERY_HOUR)
  handleCron() {
    // TODO: aggregate KPIs and store results
    // Placeholder log
    // console.log('Aggregating KPIs...');
  }
}


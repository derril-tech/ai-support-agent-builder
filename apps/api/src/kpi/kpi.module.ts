import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KpiService } from './kpi.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [KpiService],
})
export class KpiModule {}


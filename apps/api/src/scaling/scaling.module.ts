import { Module } from '@nestjs/common';
import { LoadBalancerModule } from './load-balancer/load-balancer.module';
import { DatabaseShardingModule } from './database-sharding/database-sharding.module';
import { CDNIntegrationModule } from './cdn/cdn-integration.module';
import { AutoScalingModule } from './auto-scaling/auto-scaling.module';

@Module({
  imports: [
    LoadBalancerModule,
    DatabaseShardingModule,
    CDNIntegrationModule,
    AutoScalingModule,
  ],
  exports: [
    LoadBalancerModule,
    DatabaseShardingModule,
    CDNIntegrationModule,
    AutoScalingModule,
  ],
})
export class ScalingModule {}

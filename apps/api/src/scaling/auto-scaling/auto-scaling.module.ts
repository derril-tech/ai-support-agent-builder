import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoScalingService } from './auto-scaling.service';
import { AutoScalingController } from './auto-scaling.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AutoScalingService],
  controllers: [AutoScalingController],
  exports: [AutoScalingService],
})
export class AutoScalingModule {}

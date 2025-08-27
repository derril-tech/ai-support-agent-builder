import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAuditLoggingService } from './advanced-audit-logging.service';
import { AdvancedAuditLoggingController } from './advanced-audit-logging.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AdvancedAuditLoggingService],
  controllers: [AdvancedAuditLoggingController],
  exports: [AdvancedAuditLoggingService],
})
export class AdvancedAuditLoggingModule {}

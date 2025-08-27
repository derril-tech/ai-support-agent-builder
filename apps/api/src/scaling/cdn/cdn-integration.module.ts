import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CDNIntegrationService } from './cdn-integration.service';
import { CDNIntegrationController } from './cdn-integration.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [CDNIntegrationService],
  controllers: [CDNIntegrationController],
  exports: [CDNIntegrationService],
})
export class CDNIntegrationModule {}

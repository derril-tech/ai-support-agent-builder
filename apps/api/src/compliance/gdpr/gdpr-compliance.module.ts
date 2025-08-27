// Created automatically by Cursor AI (2024-12-19)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GDPRComplianceService } from './gdpr-compliance.service';
import { GDPRComplianceController } from './gdpr-compliance.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, Organization, User]),
  ],
  controllers: [GDPRComplianceController],
  providers: [GDPRComplianceService],
  exports: [GDPRComplianceService],
})
export class GDPRComplianceModule {}

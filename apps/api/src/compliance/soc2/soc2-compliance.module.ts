// Created automatically by Cursor AI (2024-12-19)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SOC2ComplianceService } from './soc2-compliance.service';
import { SOC2ComplianceController } from './soc2-compliance.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, Organization, User]),
  ],
  controllers: [SOC2ComplianceController],
  providers: [SOC2ComplianceService],
  exports: [SOC2ComplianceService],
})
export class SOC2ComplianceModule {}

// Created automatically by Cursor AI (2024-12-19)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentResponseService } from './incident-response.service';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [IncidentResponseService],
  exports: [IncidentResponseService],
})
export class IncidentResponseModule {}

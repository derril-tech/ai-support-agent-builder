// Created automatically by Cursor AI (2024-12-19)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PenetrationTestingService } from './penetration-testing.service';
import { PenetrationTestingController } from './penetration-testing.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  controllers: [PenetrationTestingController],
  providers: [PenetrationTestingService],
  exports: [PenetrationTestingService],
})
export class PenetrationTestingModule {}

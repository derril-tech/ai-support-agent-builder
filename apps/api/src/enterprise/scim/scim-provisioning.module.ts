import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SCIMProvisioningService } from './scim-provisioning.service';
import { SCIMProvisioningController } from './scim-provisioning.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [SCIMProvisioningService],
  controllers: [SCIMProvisioningController],
  exports: [SCIMProvisioningService],
})
export class SCIMProvisioningModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomBrandingService } from './custom-branding.service';
import { CustomBrandingController } from './custom-branding.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [CustomBrandingService],
  controllers: [CustomBrandingController],
  exports: [CustomBrandingService],
})
export class CustomBrandingModule {}

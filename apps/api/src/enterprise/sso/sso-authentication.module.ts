import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SSOAuthenticationService } from './sso-authentication.service';
import { SSOAuthenticationController } from './sso-authentication.controller';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [SSOAuthenticationService],
  controllers: [SSOAuthenticationController],
  exports: [SSOAuthenticationService],
})
export class SSOAuthenticationModule {}

import { Module } from '@nestjs/common';
import { SSOAuthenticationModule } from './sso/sso-authentication.module';
import { SCIMProvisioningModule } from './scim/scim-provisioning.module';
import { AdvancedAuditLoggingModule } from './audit/advanced-audit-logging.module';
import { CustomBrandingModule } from './branding/custom-branding.module';

@Module({
  imports: [
    SSOAuthenticationModule,
    SCIMProvisioningModule,
    AdvancedAuditLoggingModule,
    CustomBrandingModule,
  ],
  exports: [
    SSOAuthenticationModule,
    SCIMProvisioningModule,
    AdvancedAuditLoggingModule,
    CustomBrandingModule,
  ],
})
export class EnterpriseModule {}

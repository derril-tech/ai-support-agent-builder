import { Module, Global } from '@nestjs/common';
import { Enforcer } from 'casbin';
import { newEnforcer } from 'casbin';
import * as path from 'path';
import { RbacGuard } from './rbac.guard';

@Global()
@Module({
  providers: [
    {
      provide: 'CASBIN_ENFORCER',
      useFactory: async (): Promise<Enforcer> => {
        const modelPath = path.join(__dirname, 'model.conf');
        const policyPath = path.join(__dirname, 'policy.csv');
        const enforcer = await newEnforcer(modelPath, policyPath);
        return enforcer;
      },
    },
    RbacGuard,
  ],
  exports: ['CASBIN_ENFORCER', RbacGuard],
})
export class RbacModule {}


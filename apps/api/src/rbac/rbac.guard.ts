import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Enforcer } from 'casbin';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(@Inject('CASBIN_ENFORCER') private readonly enforcer: Enforcer) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string; role: string } | undefined;
    const { method, path } = req;

    const sub = user?.role ?? 'anonymous';
    const obj = path;
    const act = method.toLowerCase();

    const allowed = await this.enforcer.enforce(sub, obj, act);
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}

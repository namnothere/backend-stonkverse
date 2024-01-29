import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../user/entities';
import { ROLES_KEY } from '../../shared/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) {
        return true;
      }
      const { headers } = context.switchToHttp().getRequest();
      const user = headers.user;
      return requiredRoles.some((role) => user.role === role);
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

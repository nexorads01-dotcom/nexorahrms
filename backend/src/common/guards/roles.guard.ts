import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user found');

    const roleHierarchy: Record<string, number> = {
      super_admin: 100,
      company_admin: 80,
      hr_manager: 60,
      manager: 40,
      employee: 20,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const hasRole = requiredRoles.some((role) => userLevel >= (roleHierarchy[role] || 0));

    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}

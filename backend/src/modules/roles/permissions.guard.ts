import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Fast-fail if not authenticated (JWT guard should have caught this though)
    if (!user) {
      return false;
    }

    // Load RBAC permissions + map them onto the request object for downstream use
    const { permissions, scopes } = await this.permissionsService.getUserPermissionsWithScopes(user.id);
    request.user.permissions = permissions;
    request.user.dataScopes = scopes;

    // If no specific RBAC permissions are required via @RequirePermissions
    if (!requiredPermissions || requiredPermissions.length === 0) {
      // BACKWARD COMPATIBILITY: Fallback to old @Roles decorator if present
      const oldRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (oldRoles && oldRoles.length > 0) {
        return this.checkLegacyRole(user.role, oldRoles);
      }

      return true; // No roles or permissions required beyond basic auth
    }

    // Check if user has ANY of the required permissions
    const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission));

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied. Missing required permission(s).`);
    }

    return true;
  }

  /**
   * Temporary backward compatibility for old @Roles decorator
   */
  private checkLegacyRole(userRole: string, requiredRoles: string[]): boolean {
    const hierarchies: Record<string, number> = {
      super_admin: 100,
      company_admin: 80,
      hr_manager: 60,
      manager: 40,
      employee: 20,
    };

    const userLevel = hierarchies[userRole] || 0;
    const requiredLevel = Math.min(...requiredRoles.map((r) => hierarchies[r] || 100));

    return userLevel >= requiredLevel;
  }
}

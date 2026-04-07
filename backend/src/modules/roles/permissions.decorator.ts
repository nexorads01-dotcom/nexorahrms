import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to enforce granular RBAC permissions on routes.
 * User must have *at least one* of the required permissions.
 *
 * @example
 * \`@RequirePermissions('employees:create', 'employees:edit_all')\`
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

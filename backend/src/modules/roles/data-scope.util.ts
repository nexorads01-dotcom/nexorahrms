/**
 * Helper to build Prisma filters based on data scopes
 */
export function buildScopeFilter(
  scope: string,
  user: { id: string; employeeId?: string; departmentId?: string; tenantId: string },
  options: { employeeField?: string; userField?: string } = {}
): Record<string, any> {
  const { employeeField = 'employeeId', userField = 'userId' } = options;

  switch (scope) {
    case 'self':
      if (user.employeeId) return { [employeeField]: user.employeeId };
      return { [userField]: user.id };

    case 'team':
      if (!user.employeeId) return { [userField]: user.id }; // Fallback
      // When team scope is used, the entity should have a relation back to reportingManagerId
      // Because Prisma filters can get complex, it's advised to handle nested relations at the service layer
      // For standard usage where 'employee.reportingManagerId' is accessible:
      return {
        OR: [
          { [employeeField]: user.employeeId }, // Their own
          { employee: { reportingManagerId: user.employeeId } } // Their team
        ]
      };

    case 'department':
      if (!user.departmentId) return { [userField]: user.id }; // Fallback
      return {
        OR: [
          { [employeeField]: user.employeeId },
          { employee: { departmentId: user.departmentId } }
        ]
      };

    case 'all':
      return { tenantId: user.tenantId };

    default:
      // Failsafe: strict self constraint
      return { [userField]: user.id };
  }
}

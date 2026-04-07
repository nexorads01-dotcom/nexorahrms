export declare function buildScopeFilter(scope: string, user: {
    id: string;
    employeeId?: string;
    departmentId?: string;
    tenantId: string;
}, options?: {
    employeeField?: string;
    userField?: string;
}): Record<string, any>;

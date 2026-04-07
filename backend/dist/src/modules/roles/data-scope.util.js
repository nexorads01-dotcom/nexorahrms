"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScopeFilter = buildScopeFilter;
function buildScopeFilter(scope, user, options = {}) {
    const { employeeField = 'employeeId', userField = 'userId' } = options;
    switch (scope) {
        case 'self':
            if (user.employeeId)
                return { [employeeField]: user.employeeId };
            return { [userField]: user.id };
        case 'team':
            if (!user.employeeId)
                return { [userField]: user.id };
            return {
                OR: [
                    { [employeeField]: user.employeeId },
                    { employee: { reportingManagerId: user.employeeId } }
                ]
            };
        case 'department':
            if (!user.departmentId)
                return { [userField]: user.id };
            return {
                OR: [
                    { [employeeField]: user.employeeId },
                    { employee: { departmentId: user.departmentId } }
                ]
            };
        case 'all':
            return { tenantId: user.tenantId };
        default:
            return { [userField]: user.id };
    }
}
//# sourceMappingURL=data-scope.util.js.map
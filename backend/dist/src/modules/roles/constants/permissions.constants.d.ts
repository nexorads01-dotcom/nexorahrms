export interface PermissionDefinition {
    module: string;
    action: string;
    slug: string;
    description: string;
    category: string;
}
export declare const MASTER_PERMISSIONS: PermissionDefinition[];
export declare const P: Record<string, string>;
export declare const Permissions: {
    readonly Dashboard: {
        readonly VIEW: "dashboard:view";
        readonly VIEW_ALL: "dashboard:view_all";
        readonly EXPORT: "dashboard:export";
    };
    readonly MyPortal: {
        readonly VIEW: "my_portal:view";
        readonly EDIT: "my_portal:edit";
        readonly EDIT_SENSITIVE: "my_portal:edit_sensitive";
    };
    readonly Employees: {
        readonly VIEW: "employees:view";
        readonly VIEW_ALL: "employees:view_all";
        readonly CREATE: "employees:create";
        readonly EDIT: "employees:edit";
        readonly EDIT_ALL: "employees:edit_all";
        readonly DELETE: "employees:delete";
        readonly EXPORT: "employees:export";
    };
    readonly Departments: {
        readonly VIEW: "departments:view";
        readonly VIEW_ALL: "departments:view_all";
        readonly CREATE: "departments:create";
        readonly EDIT_ALL: "departments:edit_all";
        readonly DELETE: "departments:delete";
    };
    readonly OrgChart: {
        readonly VIEW: "org_chart:view";
        readonly VIEW_ALL: "org_chart:view_all";
        readonly EXPORT: "org_chart:export";
    };
    readonly Attendance: {
        readonly VIEW: "attendance:view";
        readonly VIEW_ALL: "attendance:view_all";
        readonly CREATE: "attendance:create";
        readonly EDIT: "attendance:edit";
        readonly EDIT_ALL: "attendance:edit_all";
        readonly APPROVE: "attendance:approve";
        readonly EXPORT: "attendance:export";
    };
    readonly Leaves: {
        readonly VIEW: "leaves:view";
        readonly VIEW_ALL: "leaves:view_all";
        readonly CREATE: "leaves:create";
        readonly EDIT: "leaves:edit";
        readonly EDIT_ALL: "leaves:edit_all";
        readonly DELETE: "leaves:delete";
        readonly APPROVE: "leaves:approve";
        readonly EXPORT: "leaves:export";
    };
    readonly Payroll: {
        readonly VIEW: "payroll:view";
        readonly VIEW_ALL: "payroll:view_all";
        readonly CREATE: "payroll:create";
        readonly EDIT_ALL: "payroll:edit_all";
        readonly APPROVE: "payroll:approve";
        readonly EXPORT: "payroll:export";
    };
    readonly Settings: {
        readonly VIEW_ALL: "settings:view_all";
        readonly EDIT_ALL: "settings:edit_all";
    };
    readonly Roles: {
        readonly VIEW_ALL: "roles:view_all";
        readonly CREATE: "roles:create";
        readonly EDIT: "roles:edit";
        readonly DELETE: "roles:delete";
    };
};
export declare enum DataScope {
    SELF = "self",
    TEAM = "team",
    DEPARTMENT = "department",
    ALL = "all"
}
export interface SystemRoleDefinition {
    name: string;
    slug: string;
    description: string;
    level: number;
    permissions: Array<{
        slug: string;
        dataScope: DataScope;
    }>;
}
export declare const SYSTEM_ROLES: SystemRoleDefinition[];
export declare const LEGACY_ROLE_MAP: Record<string, string>;

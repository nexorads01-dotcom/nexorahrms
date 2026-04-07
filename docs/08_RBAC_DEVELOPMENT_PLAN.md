# 📋 Nexora HRMS — RBAC Development Plan

> **Reference**: [07_RBAC_IMPLEMENTATION_PLAN.md](./07_RBAC_IMPLEMENTATION_PLAN.md)  
> **Created**: 2026-04-04  
> **Total Estimated Duration**: 15–18 working days  
> **Execution**: Sequential (Phase 1 → 2 → 3 → 4)  

---

## Overview

This document breaks down the RBAC implementation into **4 phases**, each containing numbered tasks with specific files, commands, dependencies, and acceptance criteria. Each task should be checked off as completed.

---

## Phase 1 — Database Foundation

> **Duration**: 3–4 days  
> **Goal**: New RBAC tables in the database, permissions seeded, registration flow updated  
> **Risk**: Low — no existing functionality is broken  

### Pre-Requisites
- [x] Backend running locally (`npm run start:dev`)
- [x] PostgreSQL container running (`docker compose up -d db`)
- [x] Current Prisma migrations are up to date

---

### Task 1.1 — Add RBAC Models to Prisma Schema

**File**: `backend/prisma/schema.prisma`

**Changes**:
- Add `Role` model with fields: id, tenantId, name, slug, description, isSystem, isActive, level, timestamps
- Add `Permission` model with fields: id, module, action, slug, description, category, createdAt
- Add `RolePermission` model with fields: id, roleId, permissionId, dataScope (default "self")
- Add `UserRole` model with fields: id, userId, roleId, createdAt
- Add `roles Role[]` relation to `Tenant` model
- Add `userRoles UserRole[]` relation to `User` model
- **DO NOT** remove existing `User.role` string field

**Unique Constraints**:
- `Role`: `@@unique([tenantId, slug])`
- `Permission`: `@@unique([module, action])`, `slug @unique`
- `RolePermission`: `@@unique([roleId, permissionId])`
- `UserRole`: `@@unique([userId, roleId])`

**Cascade Deletes**:
- `RolePermission.roleId` → `onDelete: Cascade`
- `RolePermission.permissionId` → `onDelete: Cascade`
- `UserRole.userId` → `onDelete: Cascade`
- `UserRole.roleId` → `onDelete: Cascade`

**Acceptance Criteria**:
- [x] `npx prisma validate` passes with no errors
- [x] Schema contains 4 new models with correct relations
- [x] Existing models are unchanged except new relation fields

---

### Task 1.2 — Generate & Apply Prisma Migration

**Command**:
```bash
cd backend
npx prisma migrate dev --name add_rbac_tables
```

**Acceptance Criteria**:
- [x] Migration file generated in `backend/prisma/migrations/`
- [x] Migration applies successfully to PostgreSQL
- [x] 4 new tables created: `roles`, `permissions`, `role_permissions`, `user_roles`
- [x] Existing tables are untouched
- [x] `npx prisma generate` completes without error

---

### Task 1.3 — Create Master Permissions Constants

**File**: `backend/src/modules/roles/constants/permissions.constants.ts`

**Contents**:
- `PermissionDefinition` interface: `{ module, action, slug, description, category }`
- `MASTER_PERMISSIONS` array: All 48 permissions (see Section 5 of RBAC plan)
- `Permissions` object: Grouped constants for type-safe usage
  ```
  Permissions.Employees.VIEW      → 'employees:view'
  Permissions.Attendance.APPROVE  → 'attendance:approve'
  ```
- `DataScope` enum: `SELF`, `TEAM`, `DEPARTMENT`, `ALL`
- `SystemRoleDefinition` interface
- `SYSTEM_ROLES` array: 5 default roles with their permission → dataScope mappings
- `LEGACY_ROLE_MAP`: Maps old `User.role` strings to system role slugs

**Acceptance Criteria**:
- [x] File compiles with `tsc --noEmit`
- [x] Contains exactly 48 permission entries
- [x] Contains exactly 5 system role definitions
- [x] Each system role has correct permissions per the RBAC plan Section 6
- [x] All slugs follow `{module}:{action}` format

---

### Task 1.4 — Create Permissions Seeding Script

**File**: `backend/src/modules/roles/seeds/seed-permissions.ts`

**Purpose**: Seed all 48 permissions into the global `permissions` table. Idempotent — safe to run multiple times.

**Logic**:
```
1. Import MASTER_PERMISSIONS from constants
2. For each permission:
   - Upsert into `permissions` table using slug as unique key
   - Create if not exists, update description/category if exists
3. Log count of created/updated permissions
```

**Acceptance Criteria**:
- [x] Running the script creates 48 rows in `permissions` table
- [x] Running it again does NOT create duplicates
- [x] Each row has correct module, action, slug, description, category

---

### Task 1.5 — Create System Roles Seeding Function

**File**: `backend/src/modules/roles/seeds/seed-roles.ts`

**Purpose**: Callable function that seeds 5 system roles for a given tenant. Used by both registration flow and migration script.

**Logic**:
```
Function: seedSystemRoles(prismaClient, tenantId)
1. Import SYSTEM_ROLES and MASTER_PERMISSIONS from constants
2. Ensure all permissions exist in DB (call seed-permissions first)
3. For each system role:
   a. Upsert Role record (tenantId + slug as unique key)
   b. Set isSystem = true
   c. For each permission in the role's definition:
      - Find Permission by slug
      - Create RolePermission with correct dataScope
4. Return map of { slug → roleId } for assignment
```

**Acceptance Criteria**:
- [x] Creates 5 roles per tenant, all with `isSystem: true`
- [x] Each role has correct RolePermission records with dataScopes
- [x] Idempotent — running twice doesn't duplicate
- [x] Super Admin & Company Admin have ALL 48 permissions
- [x] Employee role has exactly 14 permissions

---

### Task 1.6 — Update Registration Flow

**File**: `backend/src/modules/auth/auth.service.ts`

**Changes to `register()` method**:
```
After creating tenant + admin user + employee (existing Step 3):

NEW Step 3.5: Seed RBAC
  a. Call seedPermissions(tx) — ensure permissions exist
  b. Call seedSystemRoles(tx, tenant.id) — create 5 system roles
  c. Find the "company_admin" role for this tenant
  d. Create UserRole record: { userId: user.id, roleId: companyAdminRole.id }
```

**Acceptance Criteria**:
- [x] New registration creates 5 system roles for the tenant
- [x] Admin user gets UserRole entry pointing to "company_admin" role
- [x] Registration still works end-to-end (test via API or UI)
- [x] All existing seed data (departments, designations, etc.) still created
- [x] `permissions` table has 48 rows after first registration

---

### Task 1.7 — Update Existing Seed Script

**File**: `backend/prisma/seed.ts`

**Changes**:
```
After creating demo employees (existing flow):

NEW: Assign roles to demo employees
  1. Load system roles for the tenant
  2. For each demo employee's user:
     - Check user.role (legacy field)
     - Find matching system role via LEGACY_ROLE_MAP
     - Create UserRole record if not exists
  3. Log role assignments
```

**Acceptance Criteria**:
- [x] Running `npx prisma db seed` assigns correct roles to all demo users
- [x] Managers get "manager" system role
- [x] Regular employees get "employee" system role
- [x] Admin user (NEX-0001) has "company_admin" role
- [x] No duplicate UserRole records on re-run

---

### Task 1.8 — Write Migration Script for Existing Tenants

**File**: `backend/src/modules/roles/seeds/migrate-existing-tenants.ts`

**Purpose**: One-time script to migrate existing tenants that were created before RBAC.

**Logic**:
```
1. Find all tenants
2. Seed permissions (global, run once)
3. For each tenant:
   a. Seed system roles (if not already present)
   b. Find all users for this tenant
   c. For each user:
      - Read user.role (legacy string)
      - Find matching system role via LEGACY_ROLE_MAP
      - Create UserRole record if not exists
4. Report summary: tenants migrated, users mapped, errors
```

**Command to run**:
```bash
cd backend
npx ts-node src/modules/roles/seeds/migrate-existing-tenants.ts
```

**Acceptance Criteria**:
- [x] All existing tenants get 5 system roles each
- [x] All existing users get correct UserRole records
- [x] Script is idempotent
- [x] Summary report printed to console

---

### Phase 1 — Done Checklist

- [x] All 4 new tables exist in PostgreSQL
- [x] `permissions` table has 48 rows
- [x] Each tenant has 5 system roles
- [x] Every user has at least one UserRole record
- [x] Registration flow creates roles + assigns company_admin
- [x] Seed script assigns roles to demo users
- [x] Existing app still works unchanged (no breaking changes)
- [x] All tests pass

---

## Phase 2 — Backend Guards & Services

> **Duration**: 4–5 days  
> **Goal**: Backend enforces granular permissions on every API route  
> **Depends on**: Phase 1 complete  

---

### Task 2.1 — Create Roles NestJS Module

**Files to create**:
```
backend/src/modules/roles/
├── roles.module.ts
├── roles.controller.ts
├── roles.service.ts
├── permissions.controller.ts
├── permissions.service.ts
├── dto/
│   ├── create-role.dto.ts
│   ├── update-role.dto.ts
│   └── assign-role.dto.ts
```

**`roles.module.ts`**:
- Import PrismaModule
- Register RolesService, PermissionsService
- Register RolesController, PermissionsController
- Export PermissionsService (needed by guards)

**Acceptance Criteria**:
- [x] Module compiles
- [x] Can be imported in AppModule
- [x] All services are injectable

---

### Task 2.2 — Implement PermissionsService

**File**: `backend/src/modules/roles/permissions.service.ts`

**Methods**:
| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `getUserPermissions(userId)` | userId | `string[]` | Returns all permission slugs for user |
| `getUserPermissionsWithScopes(userId)` | userId | `Map<string, DataScope>` | Permissions + broadest data scope per permission |
| `hasPermission(userId, slug)` | userId, slug | `boolean` | Single permission check |
| `getDataScope(userId, module)` | userId, module | `DataScope` | Broadest scope across all permissions for a module |
| `invalidateCache(userId)` | userId | `void` | Clears cached permissions |
| `getAllPermissions()` | — | `Permission[]` | Lists all permission definitions |

**Caching**:
- In-memory `Map<string, { permissions, scopes, expiry }>` 
- TTL: 5 minutes
- Invalidated on: role assignment, role permission change, user deactivation

**Multi-role resolution**:
```
If user has roles [Manager, CustomRole]:
  Manager has attendance:view_all → scope: team
  CustomRole has attendance:view_all → scope: department
  Result: attendance:view_all → scope: department (broader wins)

Scope ordering: self < team < department < all
```

**Acceptance Criteria**:
- [x] Returns correct permissions for each system role
- [x] Multi-role merge works correctly (broadest scope wins)
- [x] Cache reduces DB queries (test with logs)
- [x] `invalidateCache` forces fresh load on next call

---

### Task 2.3 — Implement RolesService

**File**: `backend/src/modules/roles/roles.service.ts`

**Methods**:
| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `findAll(tenantId)` | tenantId | `Role[]` | All roles for tenant with user counts |
| `findOne(tenantId, roleId)` | tenantId, id | `Role` | Role with all permissions |
| `create(tenantId, dto)` | tenantId, CreateRoleDto | `Role` | Create custom role + permissions |
| `update(tenantId, roleId, dto)` | tenantId, id, UpdateRoleDto | `Role` | Update role + permissions |
| `delete(tenantId, roleId)` | tenantId, id | `void` | Delete custom role (block system roles) |
| `assignRole(userId, roleId)` | userId, roleId | `UserRole` | Assign role to user |
| `removeRole(userId, roleId)` | userId, roleId | `void` | Remove role from user |
| `getUserRoles(userId)` | userId | `Role[]` | Get all roles assigned to user |

**Business Rules**:
- Cannot delete system roles (`isSystem: true`)
- Cannot modify system role's core permissions (can extend via additional custom roles)
- Assigning a role invalidates the user's permission cache
- Deleting a role with assigned users requires reassignment

**Acceptance Criteria**:
- [x] CRUD operations work correctly
- [x] System roles cannot be deleted (throws ForbiddenException)
- [x] Role assignment/removal triggers cache invalidation
- [x] findAll includes user count per role

---

### Task 2.4 — Create @RequirePermissions() Decorator

**File**: `backend/src/modules/roles/permissions.decorator.ts`

**Implementation**:
```typescript
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

**Also export from**: `backend/src/common/decorators/index.ts`

**Acceptance Criteria**:
- [x] Can be used on controller methods: `@RequirePermissions('employees:view')`
- [x] Supports multiple: `@RequirePermissions('employees:edit', 'employees:edit_all')`
- [x] Metadata readable by guards via Reflector

---

### Task 2.5 — Create PermissionsGuard

**File**: `backend/src/modules/roles/permissions.guard.ts`

**Logic**:
```
1. Read @RequirePermissions() metadata
2. If no permissions required → allow (pass through)
3. Get user from request
4. Load user's permissions via PermissionsService
5. Check if user has ANY of the required permissions
6. If yes:
   a. Determine dataScope for the permission's module
   b. Attach { permissions, dataScopes } to request.user
   c. Allow
7. If no → throw ForbiddenException
```

**Fallback for backward compatibility**:
```
If @RequirePermissions() is NOT set but @Roles() IS set:
  → Fall back to old RolesGuard hierarchy logic
This ensures existing @Roles() decorators still work during migration.
```

**Acceptance Criteria**:
- [x] Blocks requests without required permissions (403)
- [x] Allows requests with correct permissions
- [x] Falls back to @Roles() check if only @Roles() is set
- [x] Attaches dataScope to request for downstream use
- [x] Works as global guard (APP_GUARD)

---

### Task 2.6 — Create DataScope Utility

**File**: `backend/src/modules/roles/data-scope.util.ts`

**Purpose**: Helper function to build Prisma `where` clauses based on data scope.

**Function**:
```typescript
buildScopeFilter(
  scope: DataScope,
  user: { id, employeeId, departmentId, tenantId },
  options: { employeeField?: string, userField?: string }
): Record<string, any>
```

**Returns**:
```
scope=self       → { [employeeField]: user.employeeId }
scope=team       → { reportingManagerId: user.employeeId }
scope=department → { departmentId: user.departmentId }
scope=all        → { tenantId: user.tenantId }
```

**Acceptance Criteria**:
- [x] Returns correct filter for each scope value
- [x] Configurable field names via options
- [x] Used by service methods to scope queries

---

### Task 2.7 — Update JwtStrategy

**File**: `backend/src/modules/auth/jwt.strategy.ts`

**Changes to `validate()` method**:
```
Existing: returns { id, email, role, tenantId, employeeId, name }

New: Also include:
  - departmentId (from employee record)
  - Load permissions via PermissionsService
  - Load dataScopes via PermissionsService
  - Return: { id, email, role, tenantId, employeeId, departmentId, name, permissions, dataScopes }
```

**Acceptance Criteria**:
- [x] `request.user` now includes `permissions` array
- [x] `request.user` now includes `dataScopes` map
- [x] `request.user` now includes `departmentId`
- [x] Existing fields still present (backward compatible)

---

### Task 2.8 — Update /auth/me Endpoint

**File**: `backend/src/modules/auth/auth.service.ts`

**Changes to `getProfile()` method**:
```
Existing: returns { id, email, role, employee, tenant }

New: Also include:
  - roles: string[] (user's role slugs from UserRole)
  - permissions: string[] (aggregated permission slugs)
  - dataScopes: Record<string, string> (module → broadest scope)
```

**Acceptance Criteria**:
- [x] `/api/v1/auth/me` returns `permissions` array
- [x] `/api/v1/auth/me` returns `dataScopes` object
- [x] `/api/v1/auth/me` returns `roles` array (slug names)
- [x] Existing response fields unchanged

---

### Task 2.9 — Register in AppModule

**File**: `backend/src/app.module.ts`

**Changes**:
```
1. Import RolesModule
2. Replace RolesGuard with PermissionsGuard as APP_GUARD:
   { provide: APP_GUARD, useClass: PermissionsGuard }
3. Keep JwtAuthGuard as-is
```

**Acceptance Criteria**:
- [x] PermissionsGuard is the global guard
- [x] All routes still require JWT authentication
- [x] Existing @Roles() decorators still work (backward compat via fallback)

---

### Task 2.10 — Migrate Existing Controllers

**Files to modify**:
- `backend/src/modules/employees/employees.controller.ts`
- `backend/src/modules/departments/departments.controller.ts`
- `backend/src/modules/attendance/attendance.controller.ts`
- `backend/src/modules/leave/leave.controller.ts`
- `backend/src/modules/payroll/payroll.controller.ts`

**Migration pattern**:
```
// Before:
@Roles('hr_manager')
@Post()
create() { ... }

// After:
@RequirePermissions('employees:create')
@Post()
create() { ... }
```

**Full mapping**:

| Controller | Method | Old | New |
|------------|--------|-----|-----|
| Employees | findAll | `@Roles('employee')` | `@RequirePermissions('employees:view')` |
| Employees | getStats | `@Roles('employee')` | `@RequirePermissions('employees:view')` |
| Employees | findOne | (none) | `@RequirePermissions('employees:view')` |
| Employees | create | `@Roles('hr_manager')` | `@RequirePermissions('employees:create')` |
| Employees | update | `@Roles('hr_manager')` | `@RequirePermissions('employees:edit_all')` |
| Employees | remove | `@Roles('company_admin')` | `@RequirePermissions('employees:delete')` |
| Employees | getAllowedRoles | `@Roles('hr_manager')` | `@RequirePermissions('roles:view_all')` |
| Employees | updateEmployeeUserRole | `@Roles('hr_manager')` | `@RequirePermissions('roles:edit')` |
| Departments | findAll | (check) | `@RequirePermissions('departments:view')` |
| Departments | create | (check) | `@RequirePermissions('departments:create')` |
| Departments | update | (check) | `@RequirePermissions('departments:edit_all')` |
| Departments | delete | (check) | `@RequirePermissions('departments:delete')` |
| Attendance | checkIn | (check) | `@RequirePermissions('attendance:create')` |
| Attendance | checkOut | (check) | `@RequirePermissions('attendance:create')` |
| Attendance | getMyAttendance | (check) | `@RequirePermissions('attendance:view')` |
| Attendance | getAllAttendance | (check) | `@RequirePermissions('attendance:view_all')` |
| Leave | getTypes | (check) | `@RequirePermissions('leaves:view')` |
| Leave | apply | (check) | `@RequirePermissions('leaves:create')` |
| Leave | getRequests | (check) | `@RequirePermissions('leaves:view')` |
| Leave | approve | (check) | `@RequirePermissions('leaves:approve')` |
| Leave | reject | (check) | `@RequirePermissions('leaves:approve')` |
| Payroll | getStructures | (check) | `@RequirePermissions('payroll:view_all')` |
| Payroll | runPayroll | (check) | `@RequirePermissions('payroll:create')` |
| Payroll | getMyPayslips | (check) | `@RequirePermissions('payroll:view')` |

**Acceptance Criteria**:
- [x] All controllers use `@RequirePermissions()` instead of `@Roles()`
- [x] Import paths updated
- [x] No `@Roles()` decorators remain (can be removed later)
- [x] All API endpoints return correct responses for authorized users
- [x] Unauthorized users get 403

---

### Task 2.11 — Update Service Methods with Data Scoping

**Files to modify**:
- `backend/src/modules/employees/employees.service.ts`
- `backend/src/modules/attendance/attendance.service.ts`
- `backend/src/modules/leave/leave.service.ts`

**Pattern**:
```typescript
// Before:
async findAll(tenantId: string, query: EmployeeQueryDto) {
  const where = { tenantId, ... };
  return this.prisma.employee.findMany({ where });
}

// After:
async findAll(tenantId: string, user: AuthUser, query: EmployeeQueryDto) {
  const scope = user.dataScopes?.['employees'] || 'self';
  const scopeFilter = buildScopeFilter(scope, user, { employeeField: 'id' });
  const where = { tenantId, ...scopeFilter, ... };
  return this.prisma.employee.findMany({ where });
}
```

**Services to update**:
- `EmployeesService.findAll()` — scope employee list
- `AttendanceService.getAll()` — scope attendance records
- `AttendanceService.getToday()` — scope today's records
- `LeaveService.getRequests()` — scope leave requests
- `LeaveService.approve/reject()` — validate scope before acting

**Acceptance Criteria**:
- [x] Employee (self scope) sees only their own attendance
- [x] Manager (team scope) sees only direct reports' data
- [x] HR Manager (all scope) sees all tenant data
- [x] Employee can see employee list but NOT detailed profiles (view vs view_all)

---

### Task 2.12 — Build Role CRUD API Endpoints

**File**: `backend/src/modules/roles/roles.controller.ts`

**Endpoints**:
| Method | Path | Permission | Handler |
|--------|------|------------|---------|
| GET | `/api/v1/roles` | `roles:view_all` | `findAll()` |
| GET | `/api/v1/roles/:id` | `roles:view_all` | `findOne()` |
| POST | `/api/v1/roles` | `roles:create` | `create()` |
| PUT | `/api/v1/roles/:id` | `roles:edit` | `update()` |
| DELETE | `/api/v1/roles/:id` | `roles:delete` | `delete()` |

**File**: `backend/src/modules/roles/permissions.controller.ts`

| Method | Path | Permission | Handler |
|--------|------|------------|---------|
| GET | `/api/v1/permissions` | `roles:view_all` | `findAll()` |

**User role assignment** (add to employees controller or roles controller):
| Method | Path | Permission | Handler |
|--------|------|------------|---------|
| POST | `/api/v1/users/:id/roles` | `roles:edit` | `assignRole()` |
| DELETE | `/api/v1/users/:id/roles/:roleId` | `roles:edit` | `removeRole()` |

**Acceptance Criteria**:
- [x] All endpoints work with correct permissions
- [x] Swagger docs show new endpoints
- [x] CRUD operations are tenant-scoped
- [x] System roles cannot be deleted
- [x] Role assignment invalidates permission cache

---

### Phase 2 — Done Checklist

- [x] PermissionsGuard is the global guard
- [x] All controllers use @RequirePermissions() decorator
- [x] /auth/me returns permissions + dataScopes
- [x] Data scoping works: self, team, department, all
- [x] Role CRUD API is functional
- [x] Permission caching reduces DB queries
- [x] Backward compatibility with @Roles() maintained
- [x] All existing tests pass
- [x] Manual testing: login as Employee → cannot see others' attendance
- [x] Manual testing: login as Manager → sees only team data
- [x] Manual testing: login as Admin → sees everything

---

## Phase 3 — Frontend Permission Integration

> **Duration**: 4–5 days  
> **Goal**: UI dynamically shows/hides features based on user permissions  
> **Depends on**: Phase 2 complete  

---

### Task 3.1 — Create Permission Constants (Frontend)

**File**: `frontend/src/lib/constants/permissions.ts`

**Contents**: Mirror of backend's `Permissions` object:
```typescript
export const Permissions = {
  Employees: {
    VIEW: 'employees:view',
    VIEW_ALL: 'employees:view_all',
    CREATE: 'employees:create',
    // ...
  },
  // ... all modules
};
```

**Acceptance Criteria**:
- [x] All 48 permission slugs available
- [x] Matches backend constants exactly

---

### Task 3.2 — Create PermissionProvider & usePermission Hook

**File**: `frontend/src/lib/permissions.tsx`

**PermissionProvider**:
- React context wrapping the dashboard layout
- On mount: calls `/auth/me` → stores `permissions[]` and `dataScopes{}`
- Provides context value: `{ permissions, dataScopes, isLoading }`

**usePermission() hook**:
```typescript
function usePermission() {
  const ctx = useContext(PermissionContext);
  return {
    can: (slug: string) => boolean,
    canAny: (slugs: string[]) => boolean,
    canAll: (slugs: string[]) => boolean,
    dataScope: (module: string) => 'self' | 'team' | 'department' | 'all',
    isLoading: boolean,
  };
}
```

**Acceptance Criteria**:
- [x] `can('employees:create')` returns true/false correctly
- [x] `canAny(['leaves:approve', 'leaves:edit_all'])` works
- [x] `dataScope('attendance')` returns correct scope string
- [x] `isLoading` is true while fetching, false after

---

### Task 3.3 — Create PermissionGate Component

**File**: `frontend/src/lib/permissions.tsx` (same file)

**Component**:
```tsx
<PermissionGate permission="employees:create">
  <Button>+ Add Employee</Button>
</PermissionGate>

<PermissionGate permission="employees:delete" fallback={null}>
  <Button>Delete</Button>
</PermissionGate>

<PermissionGate permission="settings:view_all" fallback={<AccessDenied />}>
  <SettingsContent />
</PermissionGate>
```

**Props**: `permission: string`, `fallback?: ReactNode` (default: null), `children: ReactNode`

**Acceptance Criteria**:
- [x] Renders children when user has permission
- [x] Renders fallback (or nothing) when user lacks permission
- [x] Shows nothing while loading (no flash)

---

### Task 3.4 — Update Dashboard Sidebar

**File**: `frontend/src/app/dashboard/layout.tsx`

**Changes**:
1. Wrap layout with `<PermissionProvider>`
2. Add `permission` field to each nav link
3. Replace `isSuperAdmin` filtering with `can()` checks
4. Filter sections to only show links user has access to
5. Remove empty sections after filtering

**Nav link permission mapping**:
| Link | Permission |
|------|-----------|
| Dashboard | `dashboard:view` |
| My Portal | `my_portal:view` |
| Employees | `employees:view` |
| Departments | `departments:view` |
| Org Chart | `org_chart:view` |
| Attendance | `attendance:view` |
| Leaves | `leaves:view` |
| Payroll | `payroll:view` |
| Settings | `settings:view_all` |
| Billing | `settings:view_all` |

**Acceptance Criteria**:
- [x] Employee sees: Dashboard, My Portal, Employees, Departments, Attendance, Leaves
- [x] Employee does NOT see: Settings, Billing, Payroll (unless they have payroll:view)
- [x] Admin sees everything
- [x] Sidebar updates dynamically based on permissions

---

### Task 3.5 — Update Dashboard Page

**File**: `frontend/src/app/dashboard/page.tsx`

**Changes**:
- Wrap org-wide stat cards with `<PermissionGate permission="dashboard:view_all">`
- Show personal stats for everyone (own check-in, own leave balance)
- Show global stats (total employees, department breakdown) only for `dashboard:view_all`
- Show pending approval counts only for users with `leaves:approve` or `attendance:approve`

**Acceptance Criteria**:
- [x] Employee sees only their own stats
- [x] Manager sees team stats
- [x] Admin sees org-wide dashboard

---

### Task 3.6 — Update Employees Module

**Files**: `frontend/src/app/dashboard/employees/page.tsx` (and sub-pages)

**Changes**:
- "Add Employee" button: `<PermissionGate permission="employees:create">`
- "Edit" button: `<PermissionGate permission="employees:edit_all">`
- "Delete" button: `<PermissionGate permission="employees:delete">`
- "Export" button: `<PermissionGate permission="employees:export">`
- Row click → detail view: only if `can('employees:view_all')`
- Table columns: hide sensitive columns (email, phone) unless `employees:view_all`

**Acceptance Criteria**:
- [x] Employee sees basic table (Name, Dept, Designation, Status)
- [x] Employee CANNOT click into another employee's details
- [x] HR Manager sees all columns + all action buttons
- [x] Export button hidden for non-permitted users

---

### Task 3.7 — Update Attendance Module

**Files**: `frontend/src/app/dashboard/attendance/page.tsx`

**Changes**:
- Default view: own attendance only (controlled by API + data scope)
- Add "Team Attendance" / "All Attendance" tabs based on permissions
- `can('attendance:view_all')` → show full attendance table with date filters
- `can('attendance:approve')` → show regularization approval actions
- `can('attendance:export')` → show export button

**Acceptance Criteria**:
- [x] Employee sees only their own check-in/out history
- [x] Employee CANNOT see others' check-in status
- [x] Manager sees "Team" tab with direct reports
- [x] HR sees "All" tab with organization-wide data

---

### Task 3.8 — Update Leaves Module

**Files**: `frontend/src/app/dashboard/leaves/page.tsx`

**Changes**:
- Default: show own leave requests
- `can('leaves:view_all')` → show all/team leave requests based on scope
- `can('leaves:approve')` → show approve/reject buttons
- `can('leaves:create')` → show "Apply Leave" button
- `can('leaves:export')` → show export button

**Acceptance Criteria**:
- [x] Employee sees own leaves only
- [x] Manager sees team leave requests with approve/reject
- [x] HR sees all leave requests

---

### Task 3.9 — Update Departments Module

**Files**: `frontend/src/app/dashboard/departments/page.tsx`

**Changes**:
- Wrap CRUD buttons with PermissionGate
- `departments:create` → "Add Department"
- `departments:edit_all` → "Edit" buttons
- `departments:delete` → "Delete" buttons

---

### Task 3.10 — Update Settings Module

**Files**: `frontend/src/app/dashboard/settings/page.tsx`

**Changes**:
- Add "Roles & Permissions" section/tab (conditionally shown)
- `can('roles:view_all')` → show Roles section
- `can('settings:edit_all')` → show edit controls for settings

---

### Task 3.11 — Create Access Denied Page

**File**: `frontend/src/app/dashboard/access-denied/page.tsx`

**Content**: Friendly 403 page with:
- Lock icon
- "You don't have permission to access this page"
- "Contact your administrator for access"
- "Go to Dashboard" button

---

### Task 3.12 — Update Frontend API Client

**File**: `frontend/src/lib/api.ts`

**Add methods**:
```typescript
// Roles
async getRoles()
async getRole(id: string)
async createRole(data: CreateRolePayload)
async updateRole(id: string, data: UpdateRolePayload)
async deleteRole(id: string)

// Permissions
async getPermissions()

// User Role Assignment
async assignUserRole(userId: string, roleId: string)
async removeUserRole(userId: string, roleId: string)
```

---

### Phase 3 — Done Checklist

- [x] PermissionProvider wraps dashboard
- [x] usePermission hook works in all components
- [x] Sidebar filters links by permission
- [x] All CRUD buttons wrapped with PermissionGate
- [x] Employee cannot see others' attendance
- [x] Employee sees basic employee list only
- [x] Manager sees team data
- [x] Admin sees everything
- [x] Access Denied page shows for unauthorized routes
- [x] API client has role management methods

---

## Phase 4 — Roles Management UI & Polish

> **Duration**: 3–4 days  
> **Goal**: Admin UI for managing roles and permissions  
> **Depends on**: Phase 3 complete  

---

### Task 4.1 — Build Roles List Page

**File**: `frontend/src/app/dashboard/settings/roles/page.tsx`

**UI**:
- Table columns: Role Name, Description, Type (System/Custom), Users, Actions
- System roles show "System" badge, no delete button
- Custom roles show Edit + Delete buttons
- "Create Role" button at top

---

### Task 4.2 — Build Create/Edit Role Form

**File**: `frontend/src/app/dashboard/settings/roles/[id]/page.tsx` (or modal)

**UI**:
- Name input
- Description textarea
- Permission matrix (Task 4.3)
- Save / Cancel buttons

---

### Task 4.3 — Build Permission Matrix UI

**Part of**: Create/Edit Role form

**UI**:
- Grouped by category (Overview, People, Operations, Admin)
- Within each group, rows = modules, columns = actions
- Each cell = checkbox (has permission?) + data scope dropdown
- "Select All" / "Deselect All" per module row
- Visual indicator for scope: 🟢 all, 🔵 department, 🟡 team, ⚪ self

---

### Task 4.4 — Build Assign Roles Interface

**Location**: Employee detail page (`/dashboard/employees/[id]`)

**UI**:
- "Role" section showing current role(s)
- Dropdown to change/add role
- Remove role button (with confirmation)

---

### Task 4.5 — Build Delete Role Flow

**Trigger**: Delete button on Roles List page

**Flow**:
1. Click Delete → confirmation modal
2. If role has users: show "N users will be affected. Reassign to:" dropdown
3. Select replacement role → confirm
4. Users reassigned, role deleted

---

### Task 4.6 — Add Audit Logging for Role Changes

**File**: `backend/src/modules/roles/roles.service.ts` (update)

**Log events**:
- Role created: `{ action: 'CREATE', entityType: 'Role', ... }`
- Role updated: `{ action: 'UPDATE', entityType: 'Role', oldValues, newValues }`
- Role deleted: `{ action: 'DELETE', entityType: 'Role', ... }`
- Role assigned: `{ action: 'CREATE', entityType: 'UserRole', ... }`
- Role removed: `{ action: 'DELETE', entityType: 'UserRole', ... }`

---

### Task 4.7 — Optimize Permission Caching

**File**: `backend/src/modules/roles/permissions.service.ts` (update)

**Changes**:
- Add cache stats logging (hit rate, miss rate)
- Consider using Redis if available (check docker-compose.yml)
- Add cache warmup on server start for active users
- Add stale-while-revalidate pattern

---

### Task 4.8 — E2E Testing

**Test scenarios**:
1. Login as Employee → verify sidebar, employee list, attendance scope
2. Login as Manager → verify team data, approve leave works
3. Login as HR Manager → verify full access to employees, attendance
4. Login as Admin → verify settings, role management
5. Create custom role → assign to user → verify access matches
6. Edit role permissions → verify changes take effect immediately
7. Delete role → verify reassignment works

---

### Task 4.9 — Documentation Updates

**Files to update**:
- `docs/04_API_ENDPOINTS.md` — add role/permission endpoints
- `docs/03_DATABASE_SCHEMA.md` — add 4 new tables
- `docs/02_BACKEND_ARCHITECTURE.md` — add RBAC section
- Add user guide for Roles Management UI

---

### Phase 4 — Done Checklist

- [x] Roles list page shows all system + custom roles
- [x] Can create custom role with permission matrix
- [x] Can edit role permissions and data scopes
- [x] Can assign roles to users from employee page
- [x] Can delete custom role with user reassignment
- [x] Audit logs capture all role changes
- [x] All documentation updated
- [x] E2E tests pass for all role types

---

## Final Completion Checklist

- [x] **Phase 1**: Database tables, permissions seeded, registration updated
- [x] **Phase 2**: Backend guards enforce permissions, data scoping works
- [x] **Phase 3**: Frontend dynamically renders based on permissions
- [x] **Phase 4**: Admin UI for role management is complete
- [x] **Migration**: All existing users have correct roles
- [x] **Testing**: All permission combinations verified
- [x] **Documentation**: All docs updated
- [x] **No breaking changes**: Existing functionality preserved
- [x] `User.role` field marked as `@deprecated` (removal planned for future release)

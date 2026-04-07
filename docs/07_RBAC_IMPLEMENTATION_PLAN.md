# 🔐 Nexora HRMS — Role-Based Access Control (RBAC) Implementation Plan

> **Version**: 1.0  
> **Date**: 2026-04-04  
> **Status**: ✅ APPROVED  
> **Approach**: Dedicated Database-Driven RBAC Module  

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Why a Dedicated RBAC Module](#2-why-a-dedicated-rbac-module)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema Design](#4-database-schema-design)
5. [Permission Model — Module × Action Matrix](#5-permission-model--module--action-matrix)
6. [Default System Roles](#6-default-system-roles)
7. [Data Scope Model](#7-data-scope-model)
8. [Backend Implementation](#8-backend-implementation)
9. [Frontend Implementation](#9-frontend-implementation)
10. [Per-Module Access Control Rules](#10-per-module-access-control-rules)
11. [Execution Roadmap (4 Phases)](#11-execution-roadmap-4-phases)
12. [Migration Strategy](#12-migration-strategy)
13. [Extensibility Guidelines](#13-extensibility-guidelines)

---

## 1. Current State Analysis

### What Exists Today

| Layer | Current Implementation | Limitation |
|-------|----------------------|------------|
| **Prisma Schema** | `User.role` — plain `String` field with 5 hardcoded values: `super_admin`, `company_admin`, `hr_manager`, `manager`, `employee` | No granular permissions; no custom roles per tenant |
| **Backend Guard** | `RolesGuard` — static numeric hierarchy (super_admin=100 → employee=20). Route decorated with `@Roles('hr_manager')` allows anyone with level ≥ 60 | Cannot distinguish "can view employees" from "can edit employees" |
| **JWT Payload** | `{ sub, email, role, tenantId }` | No permissions array; frontend must guess what the user can do |
| **Frontend** | Single `isSuperAdmin` boolean hides/shows sidebar sections | No per-feature, per-button permission checks |

### Problems

1. All employees can see ALL others' attendance check-in status — no data scoping
2. A "manager" inherits everything below hr_manager's level — no fine-grained control
3. No way to create custom roles per tenant (e.g., "Department Head", "Payroll Clerk")
4. Frontend shows/hides entire sidebar sections — no button-level control (edit, delete, export)
5. Adding a new permission requires code changes and redeployment

---

## 2. Why a Dedicated RBAC Module

**Decision**: Database-driven RBAC module (NOT hardcoded in codebase)

### Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Hardcoded roles** | Simple, fast to build | Every change = code + deploy. No tenant customization. Dead-end for SaaS. |
| **Database-driven RBAC** | Tenants create custom roles. Granular. No redeployment. Extensible. | Slightly more complex initial setup. |

### Why This Matters for Nexora

- **Multi-tenant SaaS**: Tenant A may need "Payroll Admin"; Tenant B does not
- **Extensibility**: New modules (Recruitment, Performance, etc.) just need new permission rows — zero code changes to the RBAC engine
- **Audit trail**: Who changed what permissions, when
- **Self-service**: Company admins manage their own roles without contacting support

---

## 3. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                          │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ Permission   │──│ usePermission  │──│ <PermissionGate> │    │
│  │ Provider     │  │ Hook           │  │ Component        │    │
│  │ (Context)    │  │ can(), canAny()│  │ Wraps buttons,   │    │
│  │              │  │ dataScope()    │  │ routes, sections │    │
│  └──────┬───────┘  └────────────────┘  └──────────────────┘    │
│         │ loads on login from /auth/me                          │
└─────────┼──────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                            │
│                                                                 │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ @Permissions │──│ Permissions     │──│ Permissions      │   │
│  │ Decorator    │  │ Guard           │  │ Service          │   │
│  └──────────────┘  │ (replaces       │  │ (load, check,    │   │
│                    │  RolesGuard)     │  │  cache perms)    │   │
│  ┌──────────────┐  └─────────────────┘  └────────┬─────────┘   │
│  │ DataScope    │                                │              │
│  │ Interceptor  │  Filters query results by      │              │
│  │              │  self / team / dept / all       │              │
│  └──────────────┘                                │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                        │
│                                                                 │
│  ┌────────┐    ┌──────────────────┐    ┌──────────────┐        │
│  │  Role  │───▶│  RolePermission  │◀───│  Permission  │        │
│  └───┬────┘    │  (+ dataScope)   │    └──────────────┘        │
│      │         └──────────────────┘                             │
│      ▼                                                          │
│  ┌──────────┐                                                   │
│  │ UserRole │◀─── User                                         │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| **Permission** | A specific action on a specific module | `employees:view`, `attendance:approve` |
| **Role** | Named collection of permissions | "HR Manager" → 35 permissions |
| **Data Scope** | How much data a permission grants | `self`, `team`, `department`, `all` |
| **System Role** | Pre-seeded, cannot be deleted | Super Admin, Company Admin, HR Manager, Manager, Employee |
| **Custom Role** | Created by tenant admins | "Payroll Clerk", "Shift Supervisor", etc. |

---

## 4. Database Schema Design

### New Models (4 tables)

#### `Role` Table
```
roles
├── id          UUID  (PK)
├── tenantId    UUID  (FK → tenants)
├── name        String          — display name ("HR Manager")
├── slug        String          — unique key ("hr_manager")
├── description String?         — what this role does
├── isSystem    Boolean         — true = seeded, cannot be deleted
├── isActive    Boolean         — soft disable
├── level       Int             — hierarchy number for fallback
├── createdAt   DateTime
├── updatedAt   DateTime
└── UNIQUE(tenantId, slug)
```

#### `Permission` Table (global — NOT per-tenant)
```
permissions
├── id          UUID  (PK)
├── module      String          — "employees", "attendance", etc.
├── action      String          — "view", "create", "edit_all", etc.
├── slug        String  UNIQUE  — "employees:view_all"
├── description String?         — human-readable description
├── category    String          — "Overview", "People", "Operations", "Admin"
├── createdAt   DateTime
└── UNIQUE(module, action)
```

#### `RolePermission` Table (many-to-many with data scope)
```
role_permissions
├── id           UUID  (PK)
├── roleId       UUID  (FK → roles, CASCADE)
├── permissionId UUID  (FK → permissions, CASCADE)
├── dataScope    String DEFAULT "self"  — "self" | "team" | "department" | "all"
└── UNIQUE(roleId, permissionId)
```

#### `UserRole` Table (many-to-many)
```
user_roles
├── id        UUID  (PK)
├── userId    UUID  (FK → users, CASCADE)
├── roleId    UUID  (FK → roles, CASCADE)
├── createdAt DateTime
└── UNIQUE(userId, roleId)
```

### Changes to Existing Models

| Model | Change | Reason |
|-------|--------|--------|
| `Tenant` | Add `roles Role[]` relation | Each tenant owns its roles |
| `User` | Add `userRoles UserRole[]` relation | Users can have multiple roles |
| `User` | **KEEP** existing `role` string field | Backward compatibility during migration; deprecated after Phase 4 |

---

## 5. Permission Model — Module × Action Matrix

Every permission follows the pattern: `{module}:{action}`

### Master Permission List (~50 permissions)

| # | Module | Action | Slug | Description | Category |
|---|--------|--------|------|-------------|----------|
| 1 | dashboard | view | `dashboard:view` | View own dashboard stats | Overview |
| 2 | dashboard | view_all | `dashboard:view_all` | View org-wide dashboard stats | Overview |
| 3 | dashboard | export | `dashboard:export` | Export dashboard reports | Overview |
| 4 | my_portal | view | `my_portal:view` | View own profile & portal | Overview |
| 5 | my_portal | edit | `my_portal:edit` | Edit own contact info & preferences | Overview |
| 6 | my_portal | edit_sensitive | `my_portal:edit_sensitive` | Edit own bank details & sensitive info | Overview |
| 7 | employees | view | `employees:view` | View employee list (basic columns only) | People |
| 8 | employees | view_all | `employees:view_all` | View full employee profiles & details | People |
| 9 | employees | create | `employees:create` | Create new employees | People |
| 10 | employees | edit | `employees:edit` | Edit own employee profile | People |
| 11 | employees | edit_all | `employees:edit_all` | Edit any employee profile | People |
| 12 | employees | delete | `employees:delete` | Terminate / remove employees | People |
| 13 | employees | export | `employees:export` | Export employee list as CSV / Excel | People |
| 14 | departments | view | `departments:view` | View departments list | People |
| 15 | departments | view_all | `departments:view_all` | View department details & member lists | People |
| 16 | departments | create | `departments:create` | Create new departments | People |
| 17 | departments | edit_all | `departments:edit_all` | Edit any department | People |
| 18 | departments | delete | `departments:delete` | Delete departments | People |
| 19 | org_chart | view | `org_chart:view` | View org chart (scoped) | People |
| 20 | org_chart | view_all | `org_chart:view_all` | View full organization chart | People |
| 21 | org_chart | export | `org_chart:export` | Export org chart as image / PDF | People |
| 22 | attendance | view | `attendance:view` | View own attendance records | Operations |
| 23 | attendance | view_all | `attendance:view_all` | View all attendance records (scoped) | Operations |
| 24 | attendance | create | `attendance:create` | Check-in / check-out | Operations |
| 25 | attendance | edit | `attendance:edit` | Request regularization of own attendance | Operations |
| 26 | attendance | edit_all | `attendance:edit_all` | Edit / regularize any attendance record | Operations |
| 27 | attendance | approve | `attendance:approve` | Approve / reject regularizations | Operations |
| 28 | attendance | export | `attendance:export` | Export attendance reports | Operations |
| 29 | leaves | view | `leaves:view` | View own leave requests & balance | Operations |
| 30 | leaves | view_all | `leaves:view_all` | View all leave requests (scoped) | Operations |
| 31 | leaves | create | `leaves:create` | Apply for leave | Operations |
| 32 | leaves | edit | `leaves:edit` | Edit own pending leave requests | Operations |
| 33 | leaves | edit_all | `leaves:edit_all` | Edit any leave request | Operations |
| 34 | leaves | delete | `leaves:delete` | Cancel own pending leaves | Operations |
| 35 | leaves | approve | `leaves:approve` | Approve / reject leave requests | Operations |
| 36 | leaves | export | `leaves:export` | Export leave reports | Operations |
| 37 | payroll | view | `payroll:view` | View own payslips | Operations |
| 38 | payroll | view_all | `payroll:view_all` | View all payroll data & structures | Operations |
| 39 | payroll | create | `payroll:create` | Run payroll | Operations |
| 40 | payroll | edit_all | `payroll:edit_all` | Edit salary structures & payslips | Operations |
| 41 | payroll | approve | `payroll:approve` | Approve payroll runs | Operations |
| 42 | payroll | export | `payroll:export` | Export payroll reports & payslips | Operations |
| 43 | settings | view_all | `settings:view_all` | Access company settings page | Admin |
| 44 | settings | edit_all | `settings:edit_all` | Modify company settings | Admin |
| 45 | roles | view_all | `roles:view_all` | View all roles & permissions | Admin |
| 46 | roles | create | `roles:create` | Create new custom roles | Admin |
| 47 | roles | edit | `roles:edit` | Edit role permissions & assignments | Admin |
| 48 | roles | delete | `roles:delete` | Delete custom roles | Admin |

### Adding Permissions for Future Modules

When a new module (e.g., Recruitment) is added:
1. Add rows to the `MASTER_PERMISSIONS` constant in `permissions.constants.ts`
2. Run a seed/migration to insert them into the `permissions` table
3. Admins can then assign them to roles via the UI
4. **Zero changes needed** to the RBAC engine, guards, or frontend hooks

---

## 6. Default System Roles

Five system roles are seeded automatically when a tenant is created. They **cannot be deleted** but their permissions can be extended by assigning additional custom roles to users.

### Permission Summary Per Role

| Role | Level | Dashboard | Employees | Attendance | Leaves | Payroll | Settings | Roles |
|------|-------|-----------|-----------|------------|--------|---------|----------|-------|
| **Super Admin** | 100 | All | All | All | All | All | All | All |
| **Company Admin** | 80 | All | All | All | All | All | All | All |
| **HR Manager** | 60 | All | All | All | All | View+Export | View | — |
| **Manager** | 40 | Team | View list + Team details | Own + Team | Own + Approve team | Own payslips | — | — |
| **Employee** | 10 | Own | View list only | Own only | Own only | Own payslips | — | — |

### Detailed Role → Permission Mapping

**Super Admin & Company Admin**: ALL 48 permissions with `dataScope: all`

**HR Manager** (35 permissions):
- Dashboard: view, view_all, export (all scopes)
- My Portal: view, edit, edit_sensitive (self)
- Employees: ALL 7 permissions (all scope)
- Departments: ALL 5 permissions (all scope)
- Org Chart: ALL 3 permissions (all scope)
- Attendance: ALL 7 permissions (all scope, except create = self)
- Leaves: ALL 8 permissions (all scope, except create = self)
- Payroll: view (self), view_all, export (all)
- Settings: view_all (all)

**Manager** (22 permissions):
- Dashboard: view, view_all (team scope)
- My Portal: view, edit (self)
- Employees: view (all), view_all (team)
- Departments: view (all), view_all (department)
- Org Chart: view (all), view_all (department)
- Attendance: view (self), view_all (team), create (self), edit (self), approve (team)
- Leaves: view, create, edit, delete (self), view_all, approve (team)
- Payroll: view (self)

**Employee** (14 permissions):
- Dashboard: view (self)
- My Portal: view, edit (self)
- Employees: view (all — basic list only, no details of others)
- Departments: view (all)
- Org Chart: view (department)
- Attendance: view, create, edit (self)
- Leaves: view, create, edit, delete (self)
- Payroll: view (self)

---

## 7. Data Scope Model

Data scoping controls **how much data** a user can see for a given permission. It is stored per `RolePermission` record.

| Scope | Data Visible | Example |
|-------|-------------|---------|
| `self` | Only the user's own records | Employee sees own attendance only |
| `team` | User's direct reports (subordinates) | Manager sees their team's leave requests |
| `department` | All records in user's department | Dept Head sees full department attendance |
| `all` | All records in the tenant | HR Manager sees all employee details |

### How Data Scope Is Enforced

```
Backend flow:
1. User calls GET /api/v1/attendance
2. PermissionsGuard checks: does user have "attendance:view" or "attendance:view_all"?
3. If yes, extract dataScope from the matching RolePermission
4. DataScopeInterceptor modifies the DB query WHERE clause:
   - self   → WHERE employeeId = user.employeeId
   - team   → WHERE reportingManagerId = user.employeeId
   - dept   → WHERE departmentId = user.departmentId
   - all    → WHERE tenantId = user.tenantId (no additional filter)
5. Service executes scoped query → returns only permitted data
```

### Multi-Role Scope Resolution

A user with multiple roles takes the **widest** scope per permission:
- Role A: `attendance:view_all` with scope `team`
- Role B: `attendance:view_all` with scope `all`
- **Result**: scope = `all` (broadest wins)

---

## 8. Backend Implementation

### 8.1 New Module Structure

```
backend/src/modules/roles/
├── roles.module.ts                   — NestJS module
├── roles.controller.ts               — CRUD API for roles
├── roles.service.ts                  — Role business logic
├── permissions.controller.ts         — List / manage permissions
├── permissions.service.ts            — Permission loading, checking, caching
├── permissions.guard.ts              — Global guard (replaces RolesGuard)
├── permissions.decorator.ts          — @RequirePermissions() decorator
├── data-scope.interceptor.ts         — Auto-scopes DB queries
├── constants/
│   └── permissions.constants.ts      — Master permission list + system roles
└── dto/
    ├── create-role.dto.ts
    ├── update-role.dto.ts
    └── assign-role.dto.ts
```

### 8.2 New Decorator: `@RequirePermissions()`

Replaces `@Roles()` with granular permission checks:

```typescript
// Old approach (deprecated):
@Roles('hr_manager')
@Get()
findAll() { ... }

// New approach:
@RequirePermissions('employees:view')
@Get()
findAll() { ... }

// Multiple permissions (any one is sufficient):
@RequirePermissions('employees:edit', 'employees:edit_all')
@Put(':id')
update() { ... }
```

### 8.3 PermissionsGuard (Replaces RolesGuard)

```
Guard execution flow:
1. Read @RequirePermissions() metadata from route handler
2. If no permissions required → allow (public or no restriction)
3. Get user from request (already populated by JwtAuthGuard)
4. Load user's aggregated permissions (from cache or DB)
5. Check if ANY required permission exists in user's set
6. If yes → attach dataScope to request → allow
7. If no → throw ForbiddenException("Insufficient permissions")
```

### 8.4 DataScope Interceptor

Automatically scopes database queries:

```
For each service method:
1. Read dataScope from request (set by PermissionsGuard)
2. Build WHERE clause based on scope:
   - self       → { userId: user.id } or { employeeId: user.employeeId }
   - team       → { reportingManagerId: user.employeeId }
   - department → { departmentId: user.departmentId }
   - all        → { tenantId: user.tenantId }
3. Merge with any existing filters
4. Execute query with combined filters
```

### 8.5 PermissionsService

Core service with caching:

```
Methods:
- getUserPermissions(userId): string[]
  → loads all user's roles → aggregates permissions → caches result
  
- getUserPermissionsWithScopes(userId): Map<string, DataScope>
  → same but includes data scope per permission (broadest wins)
  
- hasPermission(userId, slug): boolean
  → checks single permission
  
- getDataScope(userId, module): DataScope
  → returns broadest scope for a module
  
- invalidateCache(userId): void
  → clears cache when roles change
```

**Caching strategy**: In-memory Map with 5-minute TTL. Invalidated on:
- Role assignment/removal
- Role permission changes
- User deactivation

### 8.6 API Endpoints

| Method | Endpoint | Required Permission | Description |
|--------|----------|-------------------|-------------|
| `GET` | `/api/v1/roles` | `roles:view_all` | List all roles for tenant |
| `GET` | `/api/v1/roles/:id` | `roles:view_all` | Get role with all permissions |
| `POST` | `/api/v1/roles` | `roles:create` | Create custom role |
| `PUT` | `/api/v1/roles/:id` | `roles:edit` | Update role name/description/permissions |
| `DELETE` | `/api/v1/roles/:id` | `roles:delete` | Delete custom role (not system) |
| `GET` | `/api/v1/permissions` | `roles:view_all` | List all available permissions |
| `POST` | `/api/v1/users/:id/roles` | `roles:edit` | Assign role to user |
| `DELETE` | `/api/v1/users/:id/roles/:roleId` | `roles:edit` | Remove role from user |

### 8.7 Updated `/auth/me` Response

```json
{
  "id": "user-uuid",
  "email": "john@company.com",
  "roles": ["hr_manager"],
  "tenant": { "id": "...", "name": "Acme Corp", "subdomain": "acme" },
  "employee": { "id": "...", "firstName": "John", "lastName": "Doe" },
  "permissions": [
    "dashboard:view",
    "dashboard:view_all",
    "employees:view",
    "employees:view_all",
    "employees:create",
    "employees:edit_all",
    "attendance:view_all",
    "leaves:approve"
  ],
  "dataScopes": {
    "dashboard": "all",
    "employees": "all",
    "attendance": "all",
    "leaves": "all",
    "departments": "all",
    "payroll": "self"
  }
}
```

The permissions array is sent on login so the frontend can do instant UI checks. **Backend still enforces server-side** — the frontend array is for rendering only.

### 8.8 Updating Existing Controllers

All existing controllers need migration from `@Roles()` to `@RequirePermissions()`:

| Controller | Current | New |
|------------|---------|-----|
| `EmployeesController.findAll()` | `@Roles('employee')` | `@RequirePermissions('employees:view')` |
| `EmployeesController.create()` | `@Roles('hr_manager')` | `@RequirePermissions('employees:create')` |
| `EmployeesController.update()` | `@Roles('hr_manager')` | `@RequirePermissions('employees:edit_all')` |
| `EmployeesController.remove()` | `@Roles('company_admin')` | `@RequirePermissions('employees:delete')` |
| `AttendanceController.getAll()` | `@Roles('employee')` | `@RequirePermissions('attendance:view')` |
| `LeaveController.approve()` | `@Roles('manager')` | `@RequirePermissions('leaves:approve')` |
| ... | ... | ... |

---

## 9. Frontend Implementation

### 9.1 Permission Context & Hook

```
frontend/src/lib/
├── permissions.tsx              — PermissionProvider + usePermission hook
└── constants/
    └── permissions.ts           — Permission slug constants (mirrors backend)
```

**Provider**: Wraps the dashboard layout. Loads permissions from `/auth/me` on login. Stores in React context.

**Hook API**:
```
const { can, canAny, canAll, dataScope, isLoading } = usePermission();

can('employees:edit_all')           → boolean
canAny(['leaves:approve', 'leaves:edit_all'])  → boolean
canAll(['settings:view_all', 'roles:view_all']) → boolean
dataScope('attendance')             → "self" | "team" | "department" | "all"
```

### 9.2 PermissionGate Component

Declarative permission wrapper for JSX:

```
<PermissionGate permission="employees:create">
  <Button>+ Add Employee</Button>        ← only rendered if user has permission
</PermissionGate>

<PermissionGate permission="employees:delete" fallback={null}>
  <Button variant="danger">Delete</Button>  ← hidden with no fallback
</PermissionGate>

<PermissionGate permission="settings:view_all" fallback={<AccessDenied />}>
  <SettingsPage />                         ← shows access denied if no permission
</PermissionGate>
```

### 9.3 Sidebar Updates

Each nav link gets a `permission` field. Links are filtered by `can(link.permission)`:

```
// Before (hardcoded):
const isSuperAdmin = role === "super_admin" || role === "company_admin";
visibleSections = navSections.filter(s => !s.adminOnly || isSuperAdmin);

// After (permission-based):
visibleSections = navSections.map(section => ({
  ...section,
  links: section.links.filter(link => !link.permission || can(link.permission))
})).filter(section => section.links.length > 0);
```

### 9.4 Roles Management UI (Settings → Roles)

New page at `/dashboard/settings/roles`:

1. **Roles List**: Table with name, description, user count, system/custom badge, actions
2. **Create Role**: Form → name, description → permission matrix checkbox grid
3. **Edit Role**: Toggle permissions on/off, set data scope dropdowns per row
4. **Assign Roles**: Dropdown in employee detail page to assign/change role
5. **Delete Role**: Confirmation modal + "Reassign N users to:" dropdown

---

## 10. Per-Module Access Control Rules

### 10.1 Dashboard

| User Type | What They See |
|-----------|--------------|
| Employee (`dashboard:view`, scope=self) | Own check-in status, own leave balance, upcoming holidays |
| Manager (`dashboard:view_all`, scope=team) | Team summary: present/absent count, pending approvals for team |
| HR/Admin (`dashboard:view_all`, scope=all) | Org-wide stats, all department summaries, system alerts |

### 10.2 My Portal

- Everyone with `my_portal:view` sees their own profile, attendance history, leave balance, payslips
- `my_portal:edit` allows editing own contact info, emergency contacts
- `my_portal:edit_sensitive` allows editing bank details — only granted to self or HR+

### 10.3 Employees Module

| Permission | Behavior |
|------------|----------|
| `employees:view` | See employee **table** — basic columns: Name, Department, Designation, Status. **No sensitive data.** |
| `employees:view_all` | Click into any employee's full profile. See all personal details. |
| `employees:create` | "Add Employee" button visible and functional |
| `employees:edit` | Edit own profile only |
| `employees:edit_all` | Edit **any** employee's details. Inline edit in table. |
| `employees:delete` | Delete/terminate employees |
| `employees:export` | "Export CSV" button visible |

**Key rule**: All employees CAN see the employee list table (basic view). Only HR/Admin can click into full profiles.

### 10.4 Departments

| Permission | Behavior |
|------------|----------|
| `departments:view` | See department list with names and basic info |
| `departments:view_all` | See department details + full member list |
| `departments:create` | Create new departments |
| `departments:edit_all` | Edit department name, code, head, parent |
| `departments:delete` | Delete departments |

### 10.5 Org Chart

| Permission | Behavior |
|------------|----------|
| `org_chart:view` | View chart scoped by data scope (own dept, team, etc.) |
| `org_chart:view_all` | View full organizational chart |
| `org_chart:export` | Export chart as image/PDF |

### 10.6 Attendance

| Permission | Behavior |
|------------|----------|
| `attendance:view` | Own attendance records only. **Cannot see others' check-in status.** |
| `attendance:view_all` | All attendance (scoped: team for managers, all for HR) |
| `attendance:create` | Check-in / check-out (everyone gets this) |
| `attendance:edit` | Request regularization of own attendance |
| `attendance:edit_all` | Admin override — edit anyone's attendance |
| `attendance:approve` | Approve/reject regularization requests (scoped) |
| `attendance:export` | Export attendance reports |

**Key rule**: Regular employees **CANNOT** see other employees' check-in/check-out status. The attendance page shows only their own records.

### 10.7 Leaves

| Permission | Behavior |
|------------|----------|
| `leaves:view` | Own leave requests & balance only |
| `leaves:view_all` | All leave requests (scoped: team/dept/all) |
| `leaves:create` | Apply for leave |
| `leaves:edit` | Edit own pending leave requests |
| `leaves:edit_all` | Edit anyone's leave |
| `leaves:delete` | Cancel own pending leave |
| `leaves:approve` | Approve/reject leave requests (scoped: team for managers) |
| `leaves:export` | Export leave reports |

### 10.8 Settings

| Permission | Behavior |
|------------|----------|
| `settings:view_all` | Access the Settings page |
| `settings:edit_all` | Modify company settings (timezone, currency, shifts, leave policies) |
| `roles:view_all` | See Roles & Permissions section |
| `roles:create` | Create new roles |
| `roles:edit` | Edit role permissions & assign roles to users |
| `roles:delete` | Delete custom roles |

---

## 11. Execution Roadmap (4 Phases)

### Phase 1 — Database Foundation (3–4 days)

| # | Task | Details |
|---|------|---------|
| 1.1 | Add `Role`, `Permission`, `RolePermission`, `UserRole` to Prisma schema | 4 new models with relations |
| 1.2 | Add `roles` relation to `Tenant` | FK link |
| 1.3 | Add `userRoles` relation to `User` | Keep existing `role` field |
| 1.4 | Run `prisma migrate dev` | Generate + apply migration |
| 1.5 | Create `permissions.constants.ts` | Master list of ~48 permissions + 5 system roles |
| 1.6 | Create permissions seeding script | Inserts all permissions into `permissions` table |
| 1.7 | Update `auth.service.ts` registration flow | Auto-create system roles + assign "Company Admin" to first user |
| 1.8 | Write migration script for existing tenants | Map `user.role` → `UserRole` records |

**Deliverable**: Database is ready. Existing app still works unchanged.

### Phase 2 — Backend Guards & Services (4–5 days)

| # | Task | Details |
|---|------|---------|
| 2.1 | Create `RolesModule` | Module, controller, service |
| 2.2 | Create `PermissionsService` | Load, check, cache user permissions |
| 2.3 | Create `RolesService` | CRUD for roles, assign/remove from users |
| 2.4 | Create `@RequirePermissions()` decorator | Metadata decorator for permission slugs |
| 2.5 | Create `PermissionsGuard` | Replace `RolesGuard` globally |
| 2.6 | Create `DataScopeInterceptor` | Scopes queries by self/team/dept/all |
| 2.7 | Update `JwtStrategy.validate()` | Attach permissions + scopes to request |
| 2.8 | Update `/auth/me` endpoint | Return `permissions[]` and `dataScopes{}` |
| 2.9 | Register in `AppModule` | Replace `RolesGuard` with `PermissionsGuard` |
| 2.10 | Migrate all controllers | Replace `@Roles()` → `@RequirePermissions()` |
| 2.11 | Update service query methods | Apply data scoping in findAll queries |
| 2.12 | Build role CRUD API endpoints | `/api/v1/roles/*`, `/api/v1/permissions` |

**Deliverable**: Backend enforces granular permissions. Backward compatible.

### Phase 3 — Frontend Permission Integration (4–5 days)

| # | Task | Details |
|---|------|---------|
| 3.1 | Create `PermissionProvider` context | Load perms from `/auth/me` |
| 3.2 | Create `usePermission()` hook | `can()`, `canAny()`, `dataScope()` |
| 3.3 | Create `<PermissionGate>` component | Declarative wrapper |
| 3.4 | Update sidebar in `dashboard/layout.tsx` | Filter by permissions |
| 3.5 | Update Dashboard page | Scope stats by permission |
| 3.6 | Update Employees module | Button/detail access per permission |
| 3.7 | Update Attendance module | Scope records by data scope |
| 3.8 | Update Leaves module | Scope list + approval actions |
| 3.9 | Update Departments module | CRUD button visibility |
| 3.10 | Update Settings module | Show Roles section conditionally |
| 3.11 | Create Access Denied page | Friendly 403 page |
| 3.12 | Update `api.ts` | Add role/permission API methods |

**Deliverable**: UI dynamically shows/hides based on permissions.

### Phase 4 — Roles Management UI & Polish (3–4 days)

| # | Task | Details |
|---|------|---------|
| 4.1 | Build Roles List page | `/dashboard/settings/roles` |
| 4.2 | Build Create/Edit Role form | Name + description + permission matrix |
| 4.3 | Build Permission Matrix UI | Checkbox grid grouped by module |
| 4.4 | Build Assign Roles interface | In employee detail page |
| 4.5 | Build Delete Role flow | Reassignment confirmation |
| 4.6 | Add audit logging | Log role changes |
| 4.7 | Permission caching optimization | In-memory cache with invalidation |
| 4.8 | E2E testing | Test all permission combinations |
| 4.9 | Documentation updates | API docs + user guide |

**Deliverable**: Complete, production-ready RBAC system.

### Timeline Summary

```
Phase 1: Database Foundation        ■■■■ (3-4 days)
Phase 2: Backend Guards & Services  ■■■■■ (4-5 days)
Phase 3: Frontend Integration       ■■■■■ (4-5 days)
Phase 4: Roles UI & Polish          ■■■■ (3-4 days)
                                    ─────────────────
                                    Total: ~15-18 days
```

---

## 12. Migration Strategy

### For Existing Users & Tenants

```
Step 1: Deploy schema migration (new tables created, old `role` field intact)
Step 2: Run data migration script:
        - Seed all 48 permissions into the `permissions` table (global, not per-tenant)
        - For each tenant: create 5 system roles
        - For each tenant's roles: create RolePermission records
        - For each user: read user.role → find matching system role → create UserRole record
Step 3: Deploy backend with PermissionsGuard
        (falls back to old role field if no UserRole found)
Step 4: Deploy frontend with PermissionProvider
Step 5: Mark User.role as @deprecated in schema
Step 6: (Future release) Remove User.role field after full validation
```

### Backward Compatibility Promise

- The `User.role` field stays throughout all 4 phases
- `PermissionsGuard` falls back to legacy role if `UserRole` records don't exist
- No breaking changes to existing API responses until Phase 4 is validated
- Old `@Roles()` decorator continues to work alongside `@RequirePermissions()`

---

## 13. Extensibility Guidelines

### Adding a New Module (e.g., Recruitment)

1. **Define permissions** — Add to `MASTER_PERMISSIONS` in `permissions.constants.ts`:
   ```
   { module: 'recruitment', action: 'view',     slug: 'recruitment:view',     ... }
   { module: 'recruitment', action: 'create',   slug: 'recruitment:create',   ... }
   { module: 'recruitment', action: 'edit_all', slug: 'recruitment:edit_all', ... }
   ```

2. **Run seed** — New permissions appear in `permissions` table

3. **Backend** — Use `@RequirePermissions('recruitment:view')` on new controllers

4. **Frontend** — Use `<PermissionGate permission="recruitment:view">` on new pages

5. **Admin UI** — New permissions automatically appear in the role editor matrix

**Zero changes needed** to: guards, hooks, context, database models, or interceptors.

### Adding a New Action Type

If a new action concept is needed (e.g., `archive`):

1. Add permissions to the constants file: `{ module: 'employees', action: 'archive', slug: 'employees:archive', ... }`
2. Run seed to insert into DB
3. Use in controller: `@RequirePermissions('employees:archive')`
4. It instantly works with existing guards and UI hooks

### Creating a Tenant-Specific Role

Admins use the Roles Management UI:
1. Click "Create Role" in Settings → Roles
2. Enter name (e.g., "Payroll Clerk") and description
3. Check desired permissions in the matrix
4. Set data scopes per permission
5. Save → Role is immediately usable
6. Assign to users from the employee detail page

---

## File Index

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | 4 new models: Role, Permission, RolePermission, UserRole |
| `backend/src/modules/roles/constants/permissions.constants.ts` | Master permission list + system role definitions |
| `backend/src/modules/roles/roles.module.ts` | NestJS module registration |
| `backend/src/modules/roles/roles.controller.ts` | Role CRUD API |
| `backend/src/modules/roles/roles.service.ts` | Role business logic |
| `backend/src/modules/roles/permissions.controller.ts` | Permission listing API |
| `backend/src/modules/roles/permissions.service.ts` | Permission checking + caching |
| `backend/src/modules/roles/permissions.guard.ts` | Global permission guard |
| `backend/src/modules/roles/permissions.decorator.ts` | @RequirePermissions() decorator |
| `backend/src/modules/roles/data-scope.interceptor.ts` | Auto-scope DB queries |
| `frontend/src/lib/permissions.tsx` | PermissionProvider + usePermission hook |
| `frontend/src/lib/constants/permissions.ts` | Frontend permission constants |
| `frontend/src/app/dashboard/settings/roles/page.tsx` | Roles management UI |

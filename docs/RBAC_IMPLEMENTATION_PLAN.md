🔐 Nexora HRMS — Role-Based Access Control (RBAC) Implementation Plan
Version: 1.0
Date: 2026-04-04
Status: ✅ APPROVED — Executing Phase 1

Table of Contents
Current State Analysis
Recommendation: Dedicated RBAC Module vs Hardcoded
Architecture Overview
Database Schema Design
Permission Model — Module × Action Matrix
Backend Implementation
Frontend Implementation
Per-Module Access Control Rules
Execution Roadmap (4 Phases)
Migration Strategy
1. Current State Analysis
What Exists Today
Layer	Current Implementation	Limitation
Prisma Schema	User.role is a plain String field with 5 hardcoded values: super_admin, company_admin, hr_manager, manager, employee	No granular permissions; no custom roles per tenant
Backend Guard	RolesGuard uses a static numeric hierarchy (super_admin=100 → employee=20). A route decorated with @Roles('hr_manager') allows anyone with level ≥ 60	Cannot distinguish "can view employees" from "can edit employees" — it's all-or-nothing based on role level
JWT Payload	Contains { sub, email, role, tenantId }	No permissions array; frontend must guess what the user can do
Frontend	Single isSuperAdmin boolean hides/shows sidebar sections	No per-feature, per-button permission checks
Problems This Creates
❌ All employees can see all others' attendance check-in status — no data scoping
❌ A "manager" can do everything an "hr_manager" can't — but maybe a manager should approve leaves but NOT edit salary structures
❌ No way to create custom roles — e.g., "Department Head" who can view their department's attendance but not others'
❌ Frontend shows/hides entire sections — no button-level control (edit, delete, export)
2. Recommendation
✅ Dedicated RBAC Module with Database-Driven Permissions
IMPORTANT

My strong recommendation is a dedicated RBAC module — NOT hardcoded roles in the codebase. Here's why:

Approach	Pros	Cons
Hardcoded in code	Simple, fast to implement	Every new permission = code change + deployment. No tenant customization.
Database-driven RBAC module	Tenants can create custom roles. Permissions are granular. No redeployment needed.	Slightly more complex initial setup.
For a multi-tenant SaaS HRMS, database-driven is the only production-viable option because:

Tenant A may want a "Payroll Admin" role; Tenant B may not
Permissions change frequently as companies grow
You'll eventually need audit trails on "who changed role permissions"
The Settings module already exists — the Roles & Permissions UI fits naturally there
Hybrid Design (Best of Both)
We'll combine:

System-defined default roles (seeded on tenant creation — cannot be deleted)
Custom tenant roles (created by admins via UI)
Granular permissions defined as module:action strings (e.g., employees:edit, attendance:view_all)
Data scoping via ownership & hierarchy rules (e.g., manager sees only their team)
3. Architecture Overview
Backend (NestJS)
Frontend (Next.js)
self
team
department
all
Database
Role
RolePermission
Permission
User
UserRole
PermissionProvider Context
usePermission Hook
PermissionGate Component
Sidebar Filtering
Route Guards
PermissionsGuard
PermissionsService
Role + Permission Tables
DataScopeInterceptor
Check Scope
Own data only
Subordinates data
Dept data
Tenant-wide data
Key Concepts
Concept	Description	Example
Permission	A specific action on a module	employees:view, employees:edit, attendance:view_all
Role	A named collection of permissions	"HR Manager" → has 25 permissions
Data Scope	How much data a permission grants	self = own record, team = subordinates, department = dept, all = everyone
System Role	Pre-seeded, non-deletable	Super Admin, Company Admin, HR Manager, Manager, Employee
Custom Role	Created by tenant admins	"Payroll Clerk", "Shift Supervisor", etc.
4. Database Schema Design
New Models to Add to schema.prisma
prisma
// ==================== ROLES ====================
model Role {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  slug        String                        // e.g. "hr_manager", "payroll_clerk"
  description String?
  isSystem    Boolean  @default(false)       // true = seeded defaults, cannot be deleted
  isActive    Boolean  @default(true)
  level       Int      @default(0)           // hierarchy: super_admin=100, employee=10
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant          Tenant           @relation(fields: [tenantId], references: [id])
  rolePermissions RolePermission[]
  userRoles       UserRole[]
  @@unique([tenantId, slug])
  @@index([tenantId, isActive])
  @@map("roles")
}
// ==================== PERMISSIONS ====================
model Permission {
  id          String   @id @default(uuid())
  module      String                         // "employees", "attendance", "leaves", etc.
  action      String                         // "view", "view_all", "create", "edit", "delete", "export", "approve"
  slug        String   @unique               // "employees:view", "attendance:view_all"
  description String?
  category    String                         // "People", "Operations", "Admin"
  createdAt   DateTime @default(now())
  rolePermissions RolePermission[]
  @@unique([module, action])
  @@map("permissions")
}
// ==================== ROLE ↔ PERMISSION (Many-to-Many) ====================
model RolePermission {
  id           String @id @default(uuid())
  roleId       String
  permissionId String
  dataScope    String @default("self")       // "self", "team", "department", "all"
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
// ==================== USER ↔ ROLE (Many-to-Many) ====================
model UserRole {
  id     String @id @default(uuid())
  userId String
  roleId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@unique([userId, roleId])
  @@map("user_roles")
}
Changes to Existing Models
diff
model User {
   ...
-  role                String    @default("employee")
+  role                String    @default("employee")  // KEEP for backward compat during migration
+  userRoles           UserRole[]
   ...
 }
 model Tenant {
   ...
+  roles              Role[]
   ...
 }
NOTE

We keep the existing User.role string field during the migration period. The new UserRole relation becomes the source of truth, but old code won't break until we fully migrate.

5. Permission Model
Master Permission Matrix
Every permission follows the pattern: {module}:{action}

Module	view	view_all	create	edit	edit_all	delete	approve	export
dashboard	✅ See own stats	✅ See org-wide stats	—	—	—	—	—	✅ Export reports
my_portal	✅ Own profile	—	—	✅ Edit own info	—	—	—	—
employees	✅ See list (basic)	✅ See all details	✅ Add employee	✅ Edit own	✅ Edit anyone	✅ Remove	—	✅ Export list
departments	✅ View list	✅ View all + members	✅ Create dept	—	✅ Edit depts	✅ Delete dept	—	—
org_chart	✅ View chart	✅ Full org chart	—	—	—	—	—	✅ Export chart
attendance	✅ Own attendance	✅ All attendance	✅ Check-in/out	✅ Edit own	✅ Regularize any	—	✅ Approve reg.	✅ Export
leaves	✅ Own leaves	✅ All leaves	✅ Apply leave	✅ Edit own	✅ Edit any	✅ Cancel own	✅ Approve/Reject	✅ Export
payroll	✅ Own payslips	✅ View all payroll	✅ Run payroll	—	✅ Edit structures	—	✅ Approve run	✅ Export
settings	—	✅ View settings	—	—	✅ Edit settings	—	—	—
roles	—	✅ View all roles	✅ Create role	—	✅ Edit roles	✅ Delete role	—	—
Total: ~50 individual permissions

Default System Roles and Their Permissions
┌─────────────────┬──────────────────────────────────────────────────────┬────────────┐
│ Role            │ Permissions (summary)                                │ Data Scope │
├─────────────────┼──────────────────────────────────────────────────────┼────────────┤
│ Super Admin     │ ALL permissions                                      │ all        │
│ Company Admin   │ ALL permissions except super_admin-only               │ all        │
│ HR Manager      │ employees:*, attendance:*, leaves:*, payroll:view_all │ all        │
│ Manager         │ employees:view, attendance:view, leaves:approve       │ team       │
│ Employee        │ my_portal:*, attendance:view, leaves:view+create      │ self       │
└─────────────────┴──────────────────────────────────────────────────────┴────────────┘
Data Scope Explained
Scope	What You Can See	Example
self	Only your own records	Employee sees their own attendance
team	Your direct reports' records	Manager sees subordinates' leave requests
department	Everyone in your department	Dept Head sees all dept attendance
all	All records in the tenant	HR Manager sees all employee details
6. Backend Implementation
6.1 New Module Structure
backend/src/modules/roles/
├── roles.module.ts
├── roles.controller.ts          # CRUD for roles
├── roles.service.ts             # Business logic
├── permissions.controller.ts    # List/manage permissions
├── permissions.service.ts       # Permission checking + caching
├── permissions.guard.ts         # NEW guard replacing RolesGuard
├── dto/
│   ├── create-role.dto.ts
│   ├── update-role.dto.ts
│   └── assign-role.dto.ts
└── permissions.seed.ts          # Master permission list for seeding
6.2 New PermissionsGuard (Replaces RolesGuard)
typescript
// Key concept: decorators at controller/method level
@Permissions('employees:view_all')        // requires this specific permission
@DataScope('employees')                   // auto-filters query by user's data scope
@Get()
findAll(@CurrentUser() user) { ... }
Guard logic:

1. Extract required permission from @Permissions() decorator
2. Load user's roles from DB (with Redis cache)
3. Aggregate all permissions from all user roles
4. Check if required permission exists in aggregated set
5. If yes → allow. If no → 403 Forbidden.
6. Attach dataScope to request for downstream filtering
6.3 DataScope Interceptor
This is the critical piece that controls "who sees what data":

typescript
// In EmployeesService.findAll()
async findAll(tenantId: string, user: AuthUser, filters: any) {
  const scope = user.dataScopes['employees'] || 'self';
  
  const where: any = { tenantId };
  
  switch (scope) {
    case 'self':
      where.userId = user.id;   // only own record
      break;
    case 'team':
      where.reportingManagerId = user.employeeId;  // direct reports
      break;
    case 'department':
      where.departmentId = user.departmentId;       // same dept
      break;
    case 'all':
      // no additional filter — full tenant access
      break;
  }
  
  return this.prisma.employee.findMany({ where, ...filters });
}
6.4 API Endpoints for Roles Module
Method	Endpoint	Permission Required	Description
GET	/api/v1/roles	roles:view_all	List all roles for tenant
GET	/api/v1/roles/:id	roles:view_all	Get role with permissions
POST	/api/v1/roles	roles:create	Create custom role
PUT	/api/v1/roles/:id	roles:edit	Update role permissions
DELETE	/api/v1/roles/:id	roles:delete	Delete custom role (not system roles)
GET	/api/v1/permissions	roles:view_all	List all available permissions
POST	/api/v1/users/:id/roles	roles:edit	Assign role to user
DELETE	/api/v1/users/:id/roles/:roleId	roles:edit	Remove role from user
GET	/api/v1/auth/me	(authenticated)	Returns user profile + permissions array
6.5 Updated JWT Payload & /me Response
json
// GET /api/v1/auth/me — Updated response
{
  "id": "user-uuid",
  "email": "john@company.com",
  "roles": ["hr_manager"],
  "tenant": { "id": "...", "name": "Acme Corp" },
  "employee": { "id": "...", "firstName": "John", "lastName": "Doe" },
  "permissions": [
    "dashboard:view",
    "dashboard:view_all",
    "employees:view",
    "employees:view_all",
    "employees:create",
    "employees:edit_all",
    "employees:delete",
    "employees:export",
    "attendance:view_all",
    "attendance:approve",
    "leaves:view_all",
    "leaves:approve",
    "leaves:export"
  ],
  "dataScopes": {
    "employees": "all",
    "attendance": "all",
    "leaves": "all",
    "dashboard": "all"
  }
}
TIP

We send the full permissions array on login/profile-fetch so the frontend can do instant client-side checks without extra API calls. The backend still enforces server-side — the frontend array is only for UI rendering.

7. Frontend Implementation
7.1 Permission Context & Hook
frontend/src/lib/
├── api.ts                     # (existing — add roles API methods)
├── permissions.tsx            # NEW — PermissionProvider + usePermission hook
└── constants/
    └── permissions.ts         # Permission string constants
Core Hook API:

typescript
// Usage in any component
const { can, canAny, canAll, dataScope, isLoading } = usePermission();
// Single check
if (can('employees:edit_all')) { showEditButton(); }
// Any of multiple
if (canAny(['leaves:approve', 'leaves:edit_all'])) { showApproveButton(); }
// Data scope check
const scope = dataScope('attendance');  // returns "self" | "team" | "department" | "all"
7.2 PermissionGate Component
tsx
// Declarative permission checks in JSX
<PermissionGate permission="employees:create">
  <Button onClick={openAddEmployeeModal}>+ Add Employee</Button>
</PermissionGate>
<PermissionGate permission="employees:delete" fallback={null}>
  <Button variant="danger" onClick={deleteEmployee}>Delete</Button>
</PermissionGate>
// Route-level protection
<PermissionGate permission="settings:view_all" fallback={<AccessDenied />}>
  <SettingsPage />
</PermissionGate>
7.3 Sidebar Updates
typescript
// dashboard/layout.tsx — Updated nav sections
const navSections: NavSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/dashboard", icon: "📊", label: "Dashboard", permission: "dashboard:view" },
      { href: "/dashboard/my-portal", icon: "🪪", label: "My Portal", permission: "my_portal:view" },
    ],
  },
  {
    title: "People",
    links: [
      { href: "/dashboard/employees", icon: "👥", label: "Employees", permission: "employees:view" },
      { href: "/dashboard/departments", icon: "🏢", label: "Departments", permission: "departments:view" },
      { href: "/dashboard/org-chart", icon: "🌳", label: "Org Chart", permission: "org_chart:view" },
    ],
  },
  // ... filtered by can(link.permission)
];
7.4 Roles & Permissions Settings UI
A new page at /dashboard/settings/roles that allows admins to:

View all roles — list with name, description, user count, system/custom badge
Create custom role — name, description, then a permission matrix checkbox grid
Edit role — toggle permissions on/off, set data scopes per permission
Assign roles to users — from the employee detail page or a dedicated assignment view
Delete custom roles — with reassignment prompt ("Move 3 users to which role?")
8. Per-Module Access Control Rules
8.1 Dashboard
User Role	What They See
Employee	Own check-in status, own leave balance, own upcoming holidays
Manager	Team summary (present/absent count of direct reports), pending approvals
HR Manager / Admin	Organization-wide stats, all department summaries, alerts
8.2 My Portal
Every user sees their own profile, attendance history, leave balance, payslips
my_portal:edit allows editing own contact info, emergency contacts, bank details
Sensitive fields (salary, bank) are read-only unless my_portal:edit_sensitive is granted
8.3 Employees Module
Permission	What It Grants
employees:view	See the employee table with basic columns (name, dept, designation, status)
employees:view_all	See detailed profiles of any employee (click into profile, see full info)
employees:create	"Add Employee" button visible + functional
employees:edit	Edit own profile only
employees:edit_all	Edit any employee's details + inline editing in table
employees:delete	Delete/terminate employees
employees:export	"Export CSV" button visible
IMPORTANT

Key rule you mentioned: All employees CAN see the employee list table (basic view). But only HR/Admin roles can click into full employee profiles and see detailed personal info. The table itself shows only: Name, Department, Designation, Status — no sensitive data.

8.4 Departments
Permission	What It Grants
departments:view	See department list
departments:view_all	See department details + member list
departments:create	Create new departments
departments:edit_all	Edit department name, code, head
departments:delete	Delete departments
8.5 Org Chart
Permission	What It Grants
org_chart:view	See the org chart (own department only, based on data scope)
org_chart:view_all	See full organization chart
org_chart:export	Export org chart as image/PDF
8.6 Attendance
Permission	What It Grants
attendance:view	See own attendance records only
attendance:view_all	See all employees' attendance (with data scope: team/dept/all)
attendance:create	Check-in/check-out (everyone has this)
attendance:edit	Edit own attendance (regularization request)
attendance:edit_all	Edit anyone's attendance (admin override)
attendance:approve	Approve/reject regularization requests
attendance:export	Export attendance reports
WARNING

Your specific requirement: Regular employees should NOT see other employees' check-in/check-out status. The attendance list page shows only their own records. Managers see their team. HR sees everyone.

8.7 Leaves
Permission	What It Grants
leaves:view	See own leave requests & balance
leaves:view_all	See all leave requests (scoped by data scope)
leaves:create	Apply for leave
leaves:edit	Edit own pending leave requests
leaves:edit_all	Edit anyone's leave
leaves:delete	Cancel own leave
leaves:approve	Approve/reject leave requests (scoped to team/dept/all)
leaves:export	Export leave reports
8.8 Settings
Permission	What It Grants
settings:view_all	Access the Settings page
settings:edit_all	Modify company settings (timezone, currency, shifts, leave policies)
roles:view_all	View Roles & Permissions section in Settings
roles:create	Create new custom roles
roles:edit	Modify role permissions
roles:delete	Delete custom roles
9. Execution Roadmap
Phase 1 — Database Foundation (Sprint 1: ~3-4 days)
#	Task	Details
1.1	Add Role, Permission, RolePermission, UserRole models to Prisma schema	See 
Section 4
1.2	Add roles relation to Tenant model	Foreign key link
1.3	Add userRoles relation to User model	Keep existing role field for now
1.4	Run prisma migrate dev	Generate and apply migration
1.5	Create permissions.seed.ts	Master list of ~50 permissions
1.6	Update seed.ts to create default system roles	5 system roles with their permission mappings
1.7	Update registration flow	Auto-create system roles + assign "Company Admin" to first user
1.8	Write migration script	For existing tenants: create roles, map existing user.role → UserRole records
Deliverable: Database is ready. Existing app still works unchanged.

Phase 2 — Backend Guards & Services (Sprint 2: ~4-5 days)
#	Task	Details
2.1	Create RolesModule (NestJS module)	Module, controller, service files
2.2	Implement PermissionsService	getUserPermissions(userId), hasPermission(userId, slug), with in-memory cache
2.3	Implement RolesService	CRUD for roles, assign/remove roles from users
2.4	Create @Permissions() decorator	Like @Roles() but checks against permission slugs
2.5	Create PermissionsGuard	Replaces RolesGuard — reads @Permissions() metadata, checks user's permission set
2.6	Create DataScopeInterceptor	Reads user's data scope for the requested module, attaches to request
2.7	Update JwtStrategy.validate()	Attach permissions + data scopes to the request user object
2.8	Update /auth/me endpoint	Return permissions[] and dataScopes{} in response
2.9	Register new module in AppModule	Replace RolesGuard with PermissionsGuard globally
2.10	Add @Permissions() decorators to ALL existing controllers	Employees, Departments, Attendance, Leave, Payroll controllers
2.11	Update service methods to use data scoping	findAll methods check scope for filtering
2.12	API endpoints for role CRUD	/api/v1/roles/* and /api/v1/permissions
Deliverable: Backend enforces granular permissions. API returns permission arrays. Backward compatible (old @Roles() still works during transition).

Phase 3 — Frontend Permission Integration (Sprint 3: ~4-5 days)
#	Task	Details
3.1	Create PermissionProvider context	Loads permissions from /auth/me, stores in context
3.2	Create usePermission() hook	can(), canAny(), canAll(), dataScope()
3.3	Create <PermissionGate> component	Declarative permission wrapper for UI elements
3.4	Update dashboard/layout.tsx sidebar	Filter nav links by permissions instead of isSuperAdmin
3.5	Update Dashboard page	Show org-wide stats only for dashboard:view_all
3.6	Update Employees module	Hide create/edit/delete buttons per permissions. Table → detail access check.
3.7	Update Attendance module	Show only own records for attendance:view. Team/All for higher scopes.
3.8	Update Leaves module	Show approval actions only for leaves:approve. Scope leave list.
3.9	Update Departments module	Hide CRUD actions per permissions
3.10	Update Settings module	Show Roles section only for roles:view_all
3.11	Create Access Denied page	Friendly 403 page with "Contact your admin" message
3.12	Update api.ts	Add role/permission API methods
Deliverable: UI dynamically shows/hides features based on user permissions. Unauthorized clicks return friendly errors.

Phase 4 — Roles Management UI & Polish (Sprint 4: ~3-4 days)
#	Task	Details
4.1	Build Roles List page (/dashboard/settings/roles)	Table with: role name, description, user count, system badge, actions
4.2	Build Create/Edit Role page	Form with name + description + permission matrix checkbox grid
4.3	Build Permission Matrix UI	Grouped by module, checkboxes for each action, data scope dropdown per row
4.4	Build Assign Roles interface	In employee detail page: dropdown to assign/change role
4.5	Build Delete Role flow	Confirmation modal + "Reassign users to:" dropdown
4.6	Add audit logging	Log role creation, permission changes, role assignments
4.7	Permission caching	Redis/in-memory cache with invalidation on role changes
4.8	E2E testing	Test all permission combinations across modules
4.9	Documentation	Update API docs + user guide for Role Management
Deliverable: Complete, production-ready RBAC system with admin UI.

10. Migration Strategy
For Existing Users/Tenants
Step 1: Deploy schema migration (new tables, keep old `role` field)
Step 2: Run data migration script:
        - Create 5 system roles per tenant
        - For each user: read `user.role`, create UserRole record → matching system role
Step 3: Deploy backend with PermissionsGuard (falls back to old role if no UserRole found)
Step 4: Deploy frontend with PermissionProvider
Step 5: After verification, mark `User.role` as @deprecated
Step 6: (Future) Remove `User.role` field in a later migration
CAUTION

The User.role field will be kept throughout all 4 phases but marked as deprecated. It serves as a fallback. Removal happens only after the RBAC system is fully validated in production.

Summary Timeline
2026-04-07
2026-04-09
2026-04-11
2026-04-13
2026-04-15
2026-04-17
2026-04-19
2026-04-21
2026-04-23
2026-04-25
Database Schema & Seeding
Backend Guards & Services
Frontend Permission Integration
Roles Management UI & Polish
Phase 1
Phase 2
Phase 3
Phase 4
RBAC Implementation Roadmap
Phase	Duration	Dependencies
Phase 1 — Database	3-4 days	None
Phase 2 — Backend	4-5 days	Phase 1
Phase 3 — Frontend	4-5 days	Phase 2
Phase 4 — Admin UI	3-4 days	Phase 3
Total	~15-18 days	Sequential
IMPORTANT

Please review this plan and confirm:

✅ Do you agree with the database-driven approach over hardcoded roles?
✅ Is the permission matrix (Section 5) covering all your use cases?
✅ Are the data scope levels (self/team/department/all) sufficient?
✅ Should we proceed with Phase 1 first?
❓ Any additional permissions or modules you'd like to add to the matrix?
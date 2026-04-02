# 🏗️ BACKEND ARCHITECTURE

## Architecture Style
**Modular Monolith** — single deployable NestJS application with clear module boundaries. Each module is self-contained with its own controller, service, and DTOs.

---

## Module Map

```
backend/src/
├── main.ts                          # App bootstrap, CORS, Swagger, ValidationPipe
├── app.module.ts                    # Root module — imports all feature modules
│
├── prisma/                          # DATABASE LAYER
│   ├── prisma.module.ts             # Global module (available everywhere)
│   └── prisma.service.ts            # PrismaClient wrapper with lifecycle hooks
│
├── common/                          # SHARED UTILITIES
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() — extracts user from JWT
│   │   ├── roles.decorator.ts          # @Roles('hr_manager') — sets required role
│   │   ├── public.decorator.ts         # @Public() — skips JWT auth
│   │   └── index.ts                    # Barrel export
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Global JWT validation (skips @Public routes)
│   │   └── roles.guard.ts             # Role hierarchy check (admin > hr > manager > employee)
│   ├── interceptors/
│   │   └── transform.interceptor.ts    # Wraps all responses in {success, data, meta}
│   └── dto/
│       └── pagination.dto.ts           # Reusable pagination (page, limit, sort, order, search)
│
└── modules/                         # FEATURE MODULES
    ├── auth/                        # 🔐 AUTHENTICATION
    │   ├── auth.module.ts
    │   ├── auth.controller.ts       # POST register, login, refresh | GET me | PUT change-password
    │   ├── auth.service.ts          # Registration (creates tenant + seeds), login, JWT tokens
    │   ├── jwt.strategy.ts          # Passport JWT strategy
    │   └── dto/auth.dto.ts          # RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto
    │
    ├── employees/                   # 👤 EMPLOYEE MANAGEMENT
    │   ├── employees.module.ts
    │   ├── employees.controller.ts  # GET list, GET :id, POST create, PUT :id, DELETE :id, GET stats
    │   ├── employees.service.ts     # CRUD + auto employee code (NEX-0001) + pagination + search
    │   └── dto/employee.dto.ts      # CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto
    │
    ├── departments/                 # 🏢 DEPARTMENT MANAGEMENT
    │   ├── departments.module.ts
    │   ├── departments.controller.ts # Full CRUD
    │   └── departments.service.ts    # CRUD + employee count + deletion protection
    │
    ├── attendance/                  # ⏰ ATTENDANCE TRACKING
    │   ├── attendance.module.ts
    │   ├── attendance.controller.ts # POST check-in/out | GET today, my, report
    │   └── attendance.service.ts    # Check-in/out + late detection + daily stats
    │
    ├── leave/                       # 🏖️ LEAVE MANAGEMENT
    │   ├── leave.module.ts
    │   ├── leave.controller.ts      # Types, requests (apply/approve/reject/cancel), balance, holidays
    │   └── leave.service.ts         # Balance calculation (total - used - pending), approvals
    │
    └── payroll/                     # 💰 PAYROLL
        ├── payroll.module.ts
        ├── payroll.controller.ts    # Structures, runs, payslips
        └── payroll.service.ts       # Auto-generate payslips from salary structures
```

---

## Request Flow

```
Client Request
    │
    ▼
┌─────────────────────────────────┐
│  main.ts (ValidationPipe, CORS) │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  JwtAuthGuard (global)          │  ← Skips if @Public()
│  Validates JWT access token     │
│  Attaches user to request       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  RolesGuard (global)            │  ← Skips if no @Roles()
│  Checks role hierarchy          │
│  admin(80) > hr(60) > mgr(40)  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Controller                     │
│  @CurrentUser() extracts:       │
│    - id, email, role, tenantId  │
│    - employeeId, name           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Service (Business Logic)       │
│  All queries filtered by        │
│  tenantId for data isolation    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  PrismaService → SQLite/PG      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  TransformInterceptor           │
│  Wraps response:                │
│  { success: true, data: {...} } │
└─────────────────────────────────┘
```

---

## Role Hierarchy

| Role | Level | Can Access |
|---|---|---|
| `super_admin` | 100 | Everything (platform-wide) |
| `company_admin` | 80 | All tenant data, settings, billing |
| `hr_manager` | 60 | Employees, attendance, leaves, payroll |
| `manager` | 40 | Team data, leave approvals |
| `employee` | 20 | Own data only (portal, check-in) |

Higher-level roles automatically inherit lower-level permissions.

---

## Multi-Tenancy

- **Strategy**: Shared database, `tenantId` column on every table
- **Isolation**: Every service method receives `tenantId` from `@CurrentUser('tenantId')`
- **Enforcement**: All Prisma queries include `where: { tenantId }` filter
- **Registration**: Creating a new tenant auto-seeds departments, designations, leave types, shifts, and subscription

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite for dev | Zero setup — no PostgreSQL install needed |
| No Redis/BullMQ yet | Keep Sprint 5 simple — add in future |
| Soft delete for employees | Status → 'terminated' instead of DELETE |
| Auto employee codes | NEX-0001, NEX-0002... auto-incremented |
| JWT in authorization header | Standard Bearer token approach |
| Global guards | Centralized auth — @Public() opt-out pattern |
| No notification module yet | Deferred to future enhancement |

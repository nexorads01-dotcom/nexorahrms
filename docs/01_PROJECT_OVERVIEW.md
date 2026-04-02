# 📋 NEXORA HRMS — Project Overview

## Product Description
**Nexora HRMS** is a multi-tenant, modular HR Management SaaS platform with a premium dark-mode glassmorphism UI. It provides employee management, attendance tracking, leave management, payroll processing, and billing — all accessible via a responsive web dashboard.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Next.js (App Router) | 14.x |
| **Styling** | Vanilla CSS + CSS Variables | — |
| **Backend** | NestJS | 10.x |
| **Language** | TypeScript | 5.x |
| **ORM** | Prisma | 7.x |
| **Database (Dev)** | SQLite | — |
| **Database (Prod)** | PostgreSQL | 16 |
| **Auth** | JWT (access + refresh tokens) | — |
| **API Docs** | Swagger / OpenAPI | — |

---

## Project Structure

```
nexora-hrms/
├── docs/                          # 📚 Developer documentation (THIS FOLDER)
│   ├── 01_PROJECT_OVERVIEW.md     # You are here
│   ├── 02_BACKEND_ARCHITECTURE.md # Backend module & API reference
│   ├── 03_DATABASE_SCHEMA.md      # All tables, relationships, enums
│   ├── 04_API_ENDPOINTS.md        # Complete endpoint map with examples
│   └── 05_DEVELOPMENT_GUIDE.md    # How to run, test, and develop
│
├── frontend/                      # Next.js 14 Application (COMPLETE)
│   └── src/app/
│       ├── globals.css            # Design system tokens
│       ├── page.tsx               # Landing page
│       ├── login/                 # Auth pages
│       ├── register/
│       ├── forgot-password/
│       └── dashboard/             # Protected dashboard (17 pages)
│           ├── layout.tsx         # Sidebar + Header shell
│           ├── page.tsx           # Dashboard home
│           ├── my-portal/         # Employee self-service
│           ├── employees/         # Employee directory, add, profile
│           ├── departments/       # Department management
│           ├── attendance/        # Attendance tracking
│           ├── leaves/            # Leave management
│           ├── payroll/           # Payroll & payslips
│           ├── settings/          # Workspace settings
│           ├── billing/           # Billing & invoices
│           ├── org-chart/         # Organization chart
│           └── notifications/     # Notification center
│
├── backend/                       # NestJS Application (IN PROGRESS)
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (18 models)
│   │   └── dev.db                # SQLite database (auto-created)
│   └── src/
│       ├── main.ts               # Bootstrap + Swagger + CORS
│       ├── app.module.ts         # Root module
│       ├── prisma/               # Database service
│       ├── common/               # Guards, decorators, interceptors
│       └── modules/              # Feature modules
│           ├── auth/             # Registration, login, JWT
│           ├── employees/        # Employee CRUD
│           ├── departments/      # Department CRUD
│           ├── attendance/       # Check-in/out, reports
│           ├── leave/            # Types, requests, balance
│           └── payroll/          # Structures, runs, payslips
│
└── shared/                       # (Future) Shared TypeScript types
```

---

## Development Status

| Component | Status | Notes |
|---|---|---|
| Frontend (17 pages) | ✅ Complete | All pages with mock data |
| Backend Project Setup | ✅ Complete | NestJS + Prisma + SQLite |
| Database Schema | ✅ Complete | 18 models defined |
| Auth Module | ✅ Code Complete | Registration, Login, JWT |
| Employee Module | ✅ Code Complete | Full CRUD + pagination |
| Department Module | ✅ Code Complete | CRUD + employee counts |
| Attendance Module | ✅ Code Complete | Check-in/out, reports |
| Leave Module | ✅ Code Complete | Types, requests, balance |
| Payroll Module | ✅ Code Complete | Structures, runs, payslips |
| Notification Module | ⏳ Deferred | Future enhancement |
| Server Startup | 🔧 Needs Fix | Prisma connection issue |
| API Testing | ⏳ Pending | After server fix |
| Frontend-Backend Integration | ⏳ Pending | Phase 2 |

---

## Ports

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3001 | http://localhost:3001 |
| Backend (NestJS) | 3000 | http://localhost:3000 |
| Swagger API Docs | 3000 | http://localhost:3000/api/docs |

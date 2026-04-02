# Nexora HRMS — Master Implementation Plan
### Last Updated: 2026-03-28 | Phase 1 MVP

---

## Project Status Overview

```
Sprint 1 ✅    Sprint 2 ✅    Sprint 3 ✅    Sprint 4 ✅    Sprint 5 ✅    Sprint 6 ✅    Sprint 7 ⬜    Sprint 8 ⬜
Foundation     Dashboard      Operations     Polish &       Backend        Integration    Remaining     Final QA &
+ Landing      + Employees    Modules UI     ESS Pages      NestJS API     + Seed Data    Features      Deployment
(Week 1-2)     (Week 3-4)     (Week 5-6)     (Week 7-8)     (Week 9)       (Week 10)      (Week 11)     (Week 12)
```

---

## Sprint 1 ✅ COMPLETE — Foundation + Landing + Auth UI

| Task | Status | Notes |
|------|--------|-------|
| Next.js frontend initialized | ✅ | Next.js 16, TypeScript |
| NestJS backend initialized | ✅ | NestJS with Prisma 7 |
| Design system (globals.css, dashboard.css, auth.css) | ✅ | Premium dark theme, CSS variables |
| Landing page (hero, features, pricing, testimonials, footer) | ✅ | Fully responsive, animated |
| Login page UI | ✅ | Now connected to real API |
| Registration page UI | ✅ | Connected to real API |
| Forgot password page UI | ✅ | UI only (no backend) |

---

## Sprint 2 ✅ COMPLETE — Dashboard + Employees UI

| Task | Status | Notes |
|------|--------|-------|
| Sidebar navigation (collapsible, icons, active state) | ✅ | Real badges from API |
| Header (search, notifications, profile avatar) | ✅ | Real user initials |
| Dashboard home (KPI cards, activity feed, quick actions) | ✅ | Connected to real API |
| Employee directory (table + grid view, search, filter, pagination) | ✅ | Connected to real API |
| Employee detail/profile page | ✅ | Tabbed: overview, job, actions |
| Add employee form | ✅ | Multi-field form |
| Department management | ✅ | Connected to real API + add modal |
| Org chart page | ✅ | UI built |

---

## Sprint 3 ✅ COMPLETE — Attendance + Leave + Payroll UI

| Task | Status | Notes |
|------|--------|-------|
| Attendance dashboard (today's summary, KPIs) | ✅ | Connected to real API |
| Check-in/out widget | ✅ | Real API: POST /attendance/check-in, check-out |
| Attendance table (name, check-in, check-out, hours, status) | ✅ | Connected to real API |
| Leave dashboard (balance cards, requests list) | ✅ | Connected to real API |
| Apply leave form (type, dates, reason) | ✅ | Connected to real API |
| Leave approve/reject buttons | ✅ | Real API actions |
| Payroll dashboard (KPI cards, payslips table) | ✅ | Connected to real API |
| Payslip detail modal (earnings/deductions breakdown) | ✅ | Parses real JSON data |
| Run payroll wizard (month/year selection + confirm) | ✅ | Connected to real API |

---

## Sprint 4 ✅ COMPLETE — ESS + Settings + Polish

| Task | Status | Notes |
|------|--------|-------|
| My Portal (ESS) page | ✅ | Profile, payslips, upcoming |
| Settings page | ✅ | Company settings UI |
| Billing page | ✅ | Subscription management UI |
| Notifications page | ✅ | UI built (no backend) |
| Loading states & skeleton screens | ✅ | Dashboard loading component |
| 404 page | ✅ | Custom error page |

---

## Sprint 5 ✅ COMPLETE — NestJS Backend API

| Task | Status | Notes |
|------|--------|-------|
| Prisma schema (18 models) | ✅ | SQLite with driver adapter |
| Auth module (register, login, JWT, refresh, change-password) | ✅ | Tested ✓ |
| Employees module (CRUD, auto-code, pagination, stats) | ✅ | Tested ✓ |
| Departments module (CRUD, employee count) | ✅ | Tested ✓ |
| Attendance module (check-in/out, daily report, history) | ✅ | Tested ✓ |
| Leave module (types, requests, balance, approve/reject, holidays) | ✅ | Tested ✓, fixed Prisma select/include bug |
| Payroll module (structures, runs, payslips) | ✅ | Tested ✓ |
| Global guards (JWT, Roles), decorators, interceptors | ✅ | Hierarchical RBAC |
| Swagger API docs at /api/docs | ✅ | 39 endpoints documented |

---

## Sprint 6 ✅ COMPLETE — Frontend-Backend Integration

| Task | Status | Notes |
|------|--------|-------|
| API client (`frontend/src/lib/api.ts`) | ✅ | JWT storage, auto-refresh, 30+ methods |
| Login page → real auth | ✅ | Stores tokens, redirects to dashboard |
| Dashboard home → real stats | ✅ | Employee count, attendance, leaves, holidays |
| Employees page → real data | ✅ | 14 employees, pagination, department filter |
| Departments page → real data | ✅ | 9 departments with employee counts |
| Attendance page → real data | ✅ | Check-in/out buttons, today's records |
| Leaves page → real data | ✅ | Balances, requests, approve/reject |
| Payroll page → real data | ✅ | Payslips, payroll runs, ₹ formatting |
| Dashboard layout → real user | ✅ | Name, initials, role, logout |
| Seed script (12 demo employees + data) | ✅ | Employees, attendance, leaves, holidays, payroll |

---

## Sprint 7 ⬜ REMAINING — Complete Features

> [!IMPORTANT]
> These are the remaining Phase 1 features that need to be built or polished.

### 7A — Frontend Pages Still Using Mock Data

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Register page → real API | ⬜ | P0 | Wire to POST /auth/register |
| Employee detail page → real API | ⬜ | P0 | Wire [id]/page.tsx to GET /employees/:id |
| Add employee form → real API | ⬜ | P0 | Wire new/page.tsx to POST /employees |
| My Portal page → real API | ⬜ | P1 | Profile data from /auth/me |
| Org chart → real data | ⬜ | P2 | Build from employee reportingManager relations |
| Settings page → real API | ⬜ | P2 | Needs backend settings endpoints |
| Notifications page | ⬜ | P3 | Deferred — no backend module |

### 7B — Backend Enhancements

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Employee search (case-insensitive) | ⬜ | P1 | SQLite `contains` is case-sensitive |
| Profile photo upload | ⬜ | P2 | Multer + static file serving |
| Export CSV endpoint | ⬜ | P2 | Employees, attendance, payroll |
| Email integration (welcome, payslip) | ⬜ | P3 | Nodemailer or SendGrid |
| Forgot password flow | ⬜ | P2 | Reset token + email |

### 7C — UI Polish

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Toast notifications (success/error feedback) | ⬜ | P1 | After create, update, delete actions |
| Loading skeletons for all pages | ⬜ | P2 | Replace "Loading..." text |
| Empty states with illustrations | ⬜ | P2 | For empty tables |
| Responsive mobile design audit | ⬜ | P2 | Sidebar drawer, table scroll |

---

## Sprint 8 ⬜ REMAINING — Deployment & QA

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Switch from SQLite to PostgreSQL | ⬜ | P0 | Production database |
| Environment configuration (prod) | ⬜ | P0 | Separate .env.production |
| Docker setup | ⬜ | P1 | Dockerfile + docker-compose |
| CI/CD pipeline | ⬜ | P2 | GitHub Actions or Vercel |
| Unit tests (backend services) | ⬜ | P1 | Jest test suites |
| E2E tests (auth flow, employee CRUD) | ⬜ | P2 | Playwright or Cypress |
| Security audit (CORS, rate limiting, input sanitization) | ⬜ | P1 | Helmet, throttler |
| Production deployment (Vercel + Railway/Supabase) | ⬜ | P0 | Frontend + Backend + DB |

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                 │
│   http://localhost:3001                                  │
│                                                         │
│   ┌──────────┐ ┌────────────┐ ┌──────────────────────┐  │
│   │ Login    │ │ Dashboard  │ │ Feature Pages        │  │
│   │ Register │ │ Home       │ │ Employees ✅         │  │
│   └──────────┘ └────────────┘ │ Departments ✅       │  │
│                               │ Attendance ✅        │  │
│   ┌──────────────────────┐    │ Leaves ✅            │  │
│   │  API Client          │    │ Payroll ✅           │  │
│   │  (src/lib/api.ts)    │    │ My Portal (mock)     │  │
│   │  JWT auto-refresh    │    │ Settings (mock)      │  │
│   └──────────┬───────────┘    └──────────────────────┘  │
│              │                                          │
└──────────────┼──────────────────────────────────────────┘
               │ HTTP (fetch)
               ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                       │
│   http://localhost:3000                                   │
│                                                          │
│   ┌───────────┐  ┌───────────────────────────────────┐   │
│   │ Swagger   │  │ Guards: JwtAuthGuard + RolesGuard │   │
│   │ /api/docs │  │ Interceptor: TransformInterceptor │   │
│   └───────────┘  └───────────────────────────────────┘   │
│                                                          │
│   ┌────────┐ ┌───────────┐ ┌─────────────┐ ┌─────────┐  │
│   │ Auth   │ │ Employees │ │ Departments │ │ Attend. │  │
│   │ 5 APIs │ │ 6 APIs    │ │ 5 APIs      │ │ 5 APIs  │  │
│   └────────┘ └───────────┘ └─────────────┘ └─────────┘  │
│   ┌────────┐ ┌───────────┐                               │
│   │ Leave  │ │ Payroll   │                               │
│   │ 9 APIs │ │ 7 APIs    │    Total: 39 API endpoints    │
│   └────────┘ └───────────┘                               │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │ Prisma 7 + SQLite (dev) / PostgreSQL (prod)      │   │
│   │ 18 Models | Driver Adapter Pattern               │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Saved Documentation

| File | Contents |
|------|----------|
| [01_PROJECT_OVERVIEW.md](file:///c:/Users/SINGER/Desktop/New%20folder%20(2)/docs/01_PROJECT_OVERVIEW.md) | Tech stack, structure, current status |
| [02_BACKEND_ARCHITECTURE.md](file:///c:/Users/SINGER/Desktop/New%20folder%20(2)/docs/02_BACKEND_ARCHITECTURE.md) | Module map, request flow, role hierarchy |
| [03_DATABASE_SCHEMA.md](file:///c:/Users/SINGER/Desktop/New%20folder%20(2)/docs/03_DATABASE_SCHEMA.md) | 18 tables, ER diagram, seed data |
| [04_API_ENDPOINTS.md](file:///c:/Users/SINGER/Desktop/New%20folder%20(2)/docs/04_API_ENDPOINTS.md) | 39 endpoints with curl examples |
| [05_DEVELOPMENT_GUIDE.md](file:///c:/Users/SINGER/Desktop/New%20folder%20(2)/docs/05_DEVELOPMENT_GUIDE.md) | Setup, env vars, commands, roadmap |

---

## Open Questions

> [!IMPORTANT]
> Please review and decide before Sprint 7:

1. **Which Sprint 7 items do you want to prioritize?** All P0s? Or specific features?
2. **Do you want to move to PostgreSQL now** or stay on SQLite for development?
3. **Do you want notifications/email** built now or deferred further?
4. **Deployment target** — Vercel + Railway? Docker? Or local-only for now?

# Nexora HRMS Architecture Audit

**Date:** 2026-04-06  
**Audited Scope:** Backend (`backend/`), Frontend (`frontend/`), DB schema (`backend/prisma/`), deployment config  
**Purpose:** Assess commercial sell-readiness for company customers

## Executive Verdict

The product has a strong foundation and clear direction, but it is **not yet enterprise-ready** in its current state.

- **Current sell-readiness score:** **4.5 / 10**
- **Suitable now for:** early pilots, small teams, low-compliance buyers
- **Not yet suitable for:** compliance-heavy or security-sensitive companies without hardening

## Critical Risks (P0)

1. **Secrets and insecure defaults in code/deploy config**
   - `docker-compose.yml`
   - `backend/src/modules/auth/auth.module.ts`
   - `backend/src/modules/auth/auth.service.ts`
   - `backend/src/modules/auth/jwt.strategy.ts`
   - Risk: security and compliance failure due to hardcoded/fallback secrets.

2. **Unsafe runtime schema operation**
   - `backend/Dockerfile` (`prisma db push --accept-data-loss`)
   - Risk: destructive schema behavior in production-like environments.

3. **Weak tenant boundary during login**
   - `backend/src/modules/auth/auth.service.ts`
   - Observation: login lookup by `email` without tenant context.
   - Risk: cross-tenant identity ambiguity when same email exists in multiple tenants.

4. **Authorization scope gaps in sensitive services**
   - `backend/src/modules/leave/leave.service.ts` (approve/reject scope checks)
   - `backend/src/modules/payroll/payroll.service.ts` (payslip access scope)
   - `backend/src/modules/leave/leave.controller.ts` + service (balance lookup scope)
   - Risk: users may access data beyond intended self/team/department scope.

5. **Cross-tenant relation integrity not consistently validated**
   - `backend/src/modules/employees/employees.service.ts`
   - Risk: entity IDs connected without always proving same-tenant ownership.

6. **Testing baseline is insufficient for production confidence**
   - `backend/test/app.e2e-spec.ts`
   - `backend/src/app.controller.ts`
   - Risk: regressions/security bugs can ship undetected.

## Medium Risks (P1)

- `frontend/src/lib/api.ts`: token storage in `localStorage` increases XSS blast radius.
- `docker-compose.yml`: `CORS_ALLOW_ALL` is too permissive as a baseline.
- `backend/src/modules/roles/permissions.service.ts`: in-memory permission cache can become stale across multiple instances.
- `backend/src/common/dto/pagination.dto.ts` + `backend/src/modules/employees/employees.service.ts`: sort field controls are not strict enough.
- Repository hygiene: committed build artifacts (`backend/dist/`) increase release and merge risk.

## Strengths

- Good tenant-first schema direction with `tenantId` across core entities (`backend/prisma/schema.prisma`).
- Global auth and RBAC guards are wired (`backend/src/app.module.ts`).
- RBAC model is strong for this stage (`backend/src/modules/roles/constants/permissions.constants.ts`).
- Frontend has centralized API and permission abstractions (`frontend/src/lib/api.ts`, `frontend/src/lib/permissions.tsx`).

## 30 / 60 / 90 Day Hardening Plan

### First 30 Days (must-do before serious sales)

- Remove hardcoded/fallback secrets; enforce required environment variables.
- Change auth login flow to tenant-aware identity lookup.
- Remove `db push --accept-data-loss` from runtime startup.
- Enforce strict service-layer scope checks for payroll/leaves/employee sensitive paths.
- Add tenant ownership validation before all relation connects.
- Establish a minimum automated test gate (auth, tenant isolation, RBAC critical paths).

### Days 31–60

- Add structured logging with request IDs, tenant IDs, and principal info.
- Improve session/token security model (prefer httpOnly cookie strategy or add compensating controls).
- Add CI quality gates: lint, typecheck, tests, migration checks, container scan.
- Strengthen query validation and API guardrails.

### Days 61–90

- Introduce distributed permission cache or invalidation strategy for multi-instance deployments.
- Expand audit logs for security-sensitive actions (role changes, approvals, payroll).
- Add performance/load testing and define operational SLOs.
- Remove committed build output (`dist`) from source control and enforce release hygiene.

## Conclusion

Nexora HRMS is architecturally promising and can become a sellable B2B product with focused hardening.  
Before broad company sales, complete P0 security and tenant-isolation improvements, then validate with integration tests and operational controls.

---

## Audit Remediation Tracker (Added 2026-04-06)

This section tracks what has already been mitigated, what is in progress, and what is still pending for future hardening.  
It is intended for periodic comparison during implementation.

### A) Risks Already Mitigated

1. **Attendance page runtime crash due to missing router import**
   - Status: **Mitigated**
   - Fix done:
     - Added `useRouter` import in `frontend/src/app/dashboard/attendance/page.tsx`.

2. **Departments page runtime crash due to missing router import**
   - Status: **Mitigated**
   - Fix done:
     - Added `useRouter` import in `frontend/src/app/dashboard/departments/page.tsx`.

3. **Attendance today endpoint blocked employee users (403)**
   - Status: **Mitigated**
   - Fix done:
     - Updated `backend/src/modules/attendance/attendance.controller.ts` so `GET /attendance/today` accepts either `attendance:view_all` or `attendance:view`.

4. **Users without RBAC `UserRole` rows had empty permissions (403 across modules)**
   - Status: **Mitigated**
   - Fix done:
     - Added legacy fallback mapping from `User.role` to `SYSTEM_ROLES` in `backend/src/modules/roles/permissions.service.ts` when no `userRoles` exist.

5. **Attendance query failures when account has no linked employee profile**
   - Status: **Mitigated**
   - Fix done:
     - Added guard handling in `backend/src/modules/attendance/attendance.service.ts` for missing `employeeId` to avoid invalid scope filters and to return safe responses.
     - Added clear bad-request messaging for check-in/check-out when no employee profile is linked.

6. **Attendance UI could not reliably detect current user's attendance row after login**
   - Status: **Mitigated**
   - Fix done:
     - Included `employee.id` in login response user payload in `backend/src/modules/auth/auth.service.ts`.

### B) In Progress / Partially Mitigated

1. **RBAC assignment consistency for newly created users/employees**
   - Status: **Partially mitigated**
   - Current state:
     - Permission fallback prevents immediate access failures.
   - Remaining work:
     - Ensure role assignment (`user_roles`) is created consistently during all user/employee creation paths to avoid reliance on fallback logic.

### C) Risks Still Open (Future Fixes Required)

1. **Secrets and fallback credentials in code/config**
   - Priority: **P0**
   - Pending actions:
     - Remove hardcoded/fallback secrets from auth and compose files.
     - Enforce required env vars at startup.

2. **Unsafe schema command in container startup**
   - Priority: **P0**
   - Pending actions:
     - Remove runtime `db push --accept-data-loss` from `backend/Dockerfile`.
     - Move schema changes to controlled migration pipeline.

3. **Tenant-aware login boundary**
   - Priority: **P0**
   - Pending actions:
     - Update login flow to include tenant context (`tenant + email`) instead of email-only lookup.

4. **Service-layer authorization scope enforcement gaps**
   - Priority: **P0**
   - Pending actions:
     - Add explicit data-scope checks in leave/payroll sensitive methods (`approve/reject`, payslip access, balance access).

5. **Cross-tenant relation ownership validation**
   - Priority: **P0**
   - Pending actions:
     - Validate all relation IDs belong to the same tenant before connect/update in employee and related services.

6. **Automated test baseline is not sufficient**
   - Priority: **P0**
   - Pending actions:
     - Fix current e2e baseline mismatch.
     - Add integration tests for tenant isolation, RBAC, and critical business flows.

7. **Token storage security posture**
   - Priority: **P1**
   - Pending actions:
     - Evaluate migration from `localStorage` token storage to httpOnly secure cookie strategy (or apply strict compensating controls).

8. **CORS baseline too permissive for production**
   - Priority: **P1**
   - Pending actions:
     - Replace allow-all behavior with environment-specific allowlists.

9. **Permission cache consistency in multi-instance deployment**
   - Priority: **P1**
   - Pending actions:
     - Introduce distributed cache/invalidation for permission updates.

10. **Repository hygiene (`dist` artifacts tracked)**
    - Priority: **P1**
    - Pending actions:
      - Stop tracking generated build output; enforce via ignore and CI checks.

### D) Recommended Review Cadence

- Update this tracker at the end of each implementation sprint.
- Mark each risk as `Open`, `In Progress`, `Mitigated`, or `Verified`.
- Keep evidence links (PR/commit/test report) with each status change.

---

## High-Priority Risk Mitigation Update (Development Environment) - 2026-04-07

This update records development-environment-focused mitigation work completed after the original audit.

### Completed Now (Mitigated in Dev Environment)

1. **Hardcoded/fallback JWT secrets in backend auth flow**
   - Status: **Mitigated (Dev)**
   - Changes:
     - Added required env helper: `backend/src/config/env.ts`
     - Updated:
       - `backend/src/modules/auth/auth.module.ts`
       - `backend/src/modules/auth/jwt.strategy.ts`
       - `backend/src/modules/auth/auth.service.ts`
   - Result:
     - Backend now requires `JWT_SECRET` and `JWT_REFRESH_SECRET` explicitly.
     - Insecure hardcoded fallback secrets were removed from these auth paths.

2. **Hardcoded secrets in docker-compose development stack**
   - Status: **Mitigated (Dev)**
   - Changes:
     - Updated `docker-compose.yml` to use environment variables instead of literal secrets for:
       - `POSTGRES_PASSWORD`
       - `PGADMIN_DEFAULT_PASSWORD`
       - `DATABASE_URL`
       - `JWT_SECRET`
       - `JWT_REFRESH_SECRET`
     - Added `.env.example` with required variable template and placeholders.
   - Result:
     - Sensitive values are no longer committed as plain literals in compose config.
     - New local setup has a clear secure-template workflow.

3. **Unsafe runtime schema command (`db push --accept-data-loss`)**
   - Status: **Mitigated (Dev)**
   - Changes:
     - Updated `backend/Dockerfile` startup command:
       - Removed `prisma db push --accept-data-loss`
       - Added `prisma migrate deploy`
       - Added optional dev seed execution controlled by `RUN_DB_SEED`
   - Result:
     - Runtime startup no longer uses destructive schema sync behavior.
     - DB schema handling is now migration-oriented.

### High-Priority Risks Still Open (Future Work Required)

1. **Tenant-aware login boundary**
   - Status: **Open (P0)**
   - Remaining:
     - Replace email-only login lookup with tenant-aware lookup (`tenant + email`).

2. **Service-layer data-scope enforcement in sensitive modules**
   - Status: **Open (P0)**
   - Remaining:
     - Enforce strict scope checks for leave approvals, payroll payslip access, and related sensitive reads/writes.

3. **Cross-tenant relation ownership validation**
   - Status: **Open (P0)**
   - Remaining:
     - Validate tenant ownership for all connected relation IDs before create/update.

4. **Automated test baseline for critical controls**
   - Status: **Open (P0)**
   - Remaining:
     - Add/repair integration and e2e coverage for tenant isolation, RBAC, and auth-sensitive paths.

### Notes for Comparison

- This update is limited to **development-environment high-priority hardening**.
- Production-grade controls (secret manager integration, full CI policy gates, distributed permission cache, advanced observability) remain tracked in earlier sections and future updates.

---

## Full Risk Mitigation Implementation Update (Development Environment) - 2026-04-07

This section records completion of the full mitigation plan in the development environment, including P0/P1/P2 tracks.

### 1) Mitigated Risks - Implemented

#### P0 - Critical

1. **Tenant-aware login boundary**
   - Status: **Mitigated (Dev)**
   - Implemented:
     - `backend/src/modules/auth/dto/auth.dto.ts` (`LoginDto` now requires `subdomain`)
     - `backend/src/modules/auth/auth.controller.ts` (login contract/docs updated)
     - `backend/src/modules/auth/auth.service.ts` (login query now scoped by `tenant.subdomain + email`)
     - `frontend/src/lib/api.ts` (tenant-aware login payload)
     - `frontend/src/app/login/page.tsx` (workspace subdomain input)

2. **Service-layer authorization scope gaps**
   - Status: **Mitigated (Dev)**
   - Implemented:
     - `backend/src/modules/leave/leave.service.ts`
       - Enforced in-scope checks for filtered requests.
       - Enforced scope for approve/reject flows.
       - Enforced scope for leave balance reads.
     - `backend/src/modules/payroll/payroll.service.ts`
       - Enforced payroll data scope on payslip reads.
     - `backend/src/modules/employees/employees.service.ts`
       - Enforced employee data scope in `findOne`.
     - Controller wiring updated where required.

3. **Cross-tenant relation ownership validation**
   - Status: **Mitigated (Dev)**
   - Implemented:
     - `backend/src/modules/employees/employees.service.ts`
       - Added tenant relation validation for `departmentId`, `designationId`, `reportingManagerId`, `salaryStructureId`, `shiftId` on create/update.
     - `backend/src/modules/leave/leave.service.ts`
       - Added tenant validation for `leaveTypeId`.
       - Added active employee validation before leave apply.

4. **Critical test baseline gap**
   - Status: **Mitigated (Dev baseline)**
   - Implemented:
     - `backend/package.json` test scripts (`test`, `test:e2e`, `test:cov`)
     - `backend/test/app.e2e-spec.ts` corrected for current API contract
     - `backend/src/modules/auth/auth.service.spec.ts` added tenant-login unit coverage

#### P1 - Security and Operational

5. **CORS permissive baseline**
   - Status: **Mitigated (Dev)**
   - Implemented:
     - `docker-compose.yml` now defaults to strict CORS config via env (`CORS_ALLOW_ALL=false`, explicit origins)
     - `backend/src/main.ts` blocks `CORS_ALLOW_ALL=true` in production
     - `.env.example` includes CORS env template

6. **Generated artifact hygiene risk**
   - Status: **Mitigated (Process/Policy in Dev)**
   - Implemented:
     - `backend/.gitignore` now excludes `dist/` and `*.tsbuildinfo`
     - CI guard added to fail when tracked build artifacts are present

7. **CI quality gates missing**
   - Status: **Mitigated (Dev baseline)**
   - Implemented:
     - `.github/workflows/ci.yml` with backend build/lint/test, frontend build, and artifact hygiene gate

#### P2 - Operational Maturity (Development-ready implementation)

8. **Distributed permission cache coherence risk**
   - Status: **Mitigated (Dev-ready optional mode)**
   - Implemented:
     - `backend/src/modules/roles/permissions.service.ts`
       - Added optional Redis-backed distributed invalidation (`REDIS_URL` driven)
       - Cross-instance invalidation publish/subscribe support with safe fallback
     - `backend/package.json` added `redis` dependency

9. **Observability and readiness gaps**
   - Status: **Mitigated (Dev baseline)**
   - Implemented:
     - `backend/src/main.ts` request-level structured access logging with request IDs and latency
     - `backend/src/app.controller.ts` readiness endpoint (`/api/ready`) with DB probe

### 2) Remaining Future Work (Non-blocking for Dev, Recommended for Live)

These are not unresolved vulnerabilities in the current dev hardening baseline, but recommended production maturity steps:

- Integrate external secret manager and secret rotation policy.
- Add full integration/e2e matrix for leave/payroll/employee scope paths and cross-tenant abuse cases.
- Add metrics backend and dashboards/alerts (SLO-backed).
- Add explicit runbooks for incident response, backup/restore, and disaster recovery.

### 3) Current Summary

- **Development environment risk mitigation objective:** **Completed**
- **Critical architectural controls for dev hardening:** **Implemented**
- **Recommended next step before live deployment:** Production hardening validation run (security + performance + rollback drill) and evidence sign-off.

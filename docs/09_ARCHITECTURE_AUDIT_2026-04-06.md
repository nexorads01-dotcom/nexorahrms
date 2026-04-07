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

# Nexora HRMS — Implementation Plan (Revised)

> **Reference:** [Jisr Demo Hub](https://www.jisr.net/en/demo-hub) · **Tech Stack:** NestJS + Prisma + PostgreSQL (Backend) · Next.js (Frontend)
> **Last Updated:** 2026-04-04

---

## Executive Summary

Nexora HRMS currently has **3 core modules** implemented (HR, Payroll, T&A). The immediate priority is to **polish and complete existing features** before adding new modules. All new modules are marked as **future phases** and have been added to the sidebar as placeholder pages (super_admin only).

---

## Current State

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | **HR (Core)** | ✅ Active | Employees, Departments, Org Chart, Documents, My Portal |
| 2 | **Payroll** | ✅ Active | Salary Structures, Payroll Runs, Payslips |
| 3 | **T&A** | ✅ Active | Attendance tracking, Shifts, Leave management |

> **Current focus:** Strengthen and complete the above 3 modules before moving to future phases.

---

## Future Phases Overview

| Phase | Module(s) | Priority | Timeline |
|-------|-----------|----------|----------|
| **F1** | Compliance | 🔴 High | Next Quarter |
| **F2** | Engagement (with Notifications) | 🔴 High | Next Quarter |
| **F3** | ATS + Performance | 🟡 Medium | Future |
| **F4** | Travel + Expense | 🟡 Medium | Future |
| **F5** | Salary Benchmarking | 🟢 Low | Future Enhancement |
| **F6** | T&A Enhancements (Overtime, Timesheets, Scheduler) | 🟢 Low | Future Enhancement |

---

## Phase F1 — Compliance Module (Future — Next Quarter)

> Statutory compliance engine — auto-validate employee data, flag risks, track regulatory requirements.

### Key Features
- **Compliance Rules Engine** — Configurable rules per country/region (contract validity, visa, tax registration)
- **Employee Compliance Status** — Real-time compliance score per employee
- **Compliance Alerts** — Auto-generated alerts for upcoming expirations
- **Violation Tracking** — Log violations, penalties, remediation actions
- **Compliance Checklists** — Onboarding, annual, offboarding checklists
- **Compliance Reports** — Audit-ready organization-wide reports
- **End-of-Service Calculator** — Auto-calculate settlement

### Schema (Planned)
- `ComplianceRule` — tenant rules with field/operator/value matching
- `ComplianceChecklist` + `ComplianceChecklistCompletion` — checklists per employee
- `ComplianceViolation` — violation tracking with severity and resolution

### Estimated Effort: ~46h

---

## Phase F2 — Engagement Module (Future — with Notifications)

> Employee engagement features built alongside the existing Notification module.

### Key Features
- **Company Announcements** — Company-wide or targeted with read tracking
- **Employee Surveys** — Custom surveys (pulse, eNPS, exit, probation)
- **eNPS Scoring** — Employee Net Promoter Score tracking
- **Recognition / Kudos** — Peer-to-peer recognition
- **Birthday & Anniversary Celebrations** — Auto-notification triggers
- **Survey Analytics** — Response rates, sentiment trends

### Schema (Planned)
- `Announcement` + `AnnouncementRead` — announcements with read receipts
- `Survey` + `SurveyResponse` — surveys with response collection
- `Recognition` — peer recognition entries

### Estimated Effort: ~46h

---

## Phase F3 — ATS + Performance (Future)

### ATS (Applicant Tracking System)
- Job Postings + publish/close lifecycle
- Candidate Pipeline (Kanban: Applied → Screened → Interview → Offer → Hired)
- Interview Scheduling + feedback
- Hiring Request approval workflow
- Candidate-to-Employee auto-conversion
- Career Page (public, tenant-branded)
- Hiring Analytics

**Schema:** `JobPosting`, `Candidate`, `Interview`, `HiringRequest`
**Estimated Effort: ~51h**

### Performance Management
- Performance Cycles (annual, mid-year, probation, contract renewal)
- Evaluation Templates with configurable criteria
- 360° Feedback (self, manager, peer, upward)
- Rating Calibration
- Goals / OKRs tracking
- Performance Insights & analytics

**Schema:** `PerformanceCycle`, `EvaluationTemplate`, `PerformanceReview`, `Goal`
**Estimated Effort: ~54h**

---

## Phase F4 — Travel + Expense (Future)

### Travel Management
- Travel Requests with destination, dates, purpose, cost estimation
- Multi-level Approval Workflow
- Travel Policies (per-diem limits, class restrictions, advance notice)
- Travel Itinerary tracking
- Travel Advance tracking
- Travel Analytics

**Schema:** `TravelPolicy`, `TravelRequest`
**Estimated Effort: ~34h**

### Expense Management
- Expense Claims with line items, categories, receipts
- Receipt Upload & tracking
- Configurable Expense Categories
- Multi-level Approval Workflow
- Expense Policies (spending limits, department budgets)
- Payroll Integration (approved reimbursements → payroll)
- Expense Analytics

**Schema:** `ExpenseCategory`, `ExpensePolicy`, `ExpenseReport`, `ExpenseItem`
**Estimated Effort: ~46h**

---

## Phase F5 — Salary Benchmarking (Future Enhancement)

- Job Families & Career Levels
- Salary Bands (min/mid/max per level)
- Employee Band Mapping + Compa-Ratio
- Market Benchmark data (admin-uploadable)
- Pay Equity Analysis
- Compensation Insights Dashboard

**Schema:** `JobFamily`, `JobLevel`, `SalaryBand`, `EmployeeBandMapping`, `MarketBenchmark`
**Estimated Effort: ~42h**

---

## Phase F6 — T&A Enhancements (Future Enhancement)

- Overtime Management (auto-calculate, configurable rules)
- Advanced Shift Scheduling (weekly templates, rotation patterns)
- Punch Correction Workflow
- Timesheet Module (project/task-based time logging)
- Working Hours Dashboard & analytics
- Geo-fencing Rules

**Schema:** `OvertimeRule`, `ShiftSchedule`, `PunchCorrection`, `Timesheet`, `TimesheetEntry`
**Estimated Effort: ~39h**

---

## Sidebar Implementation (Done ✅)

All future modules are now visible in the dashboard sidebar for **super_admin users only**, grouped under three suites:

```
— CORE HR SUITE —
✅ Compliance (Coming Soon)

— TALENT SUITE —
📋 Recruitment (Coming Soon)
⭐ Performance (Coming Soon)
💬 Engagement (Coming Soon)
💵 Compensation (Coming Soon)

— SPEND SUITE —
✈️ Travel (Coming Soon)
💳 Expenses (Coming Soon)
```

Each module shows a premium "Coming Soon" placeholder page explaining what the module will offer.

---

## Total Future Effort Summary

| Phase | Module | Effort |
|-------|--------|--------|
| F1 | Compliance | ~46h |
| F2 | Engagement | ~46h |
| F3 | ATS + Performance | ~105h |
| F4 | Travel + Expense | ~80h |
| F5 | Salary Benchmarking | ~42h |
| F6 | T&A Enhancements | ~39h |
| | **Grand Total (Future)** | **~358h** |

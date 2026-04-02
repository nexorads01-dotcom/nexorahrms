# 🔌 API ENDPOINTS REFERENCE

## Base URL
```
Development: http://localhost:3000/api/v1
Swagger UI:  http://localhost:3000/api/docs
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```

## Standard Response Format
```json
// Success
{ "success": true, "data": { ... } }

// Success with pagination
{ "success": true, "data": { "items": [...] }, "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 } }

// Error
{ "success": false, "message": "Error description", "statusCode": 400 }
```

---

## 🔐 AUTH MODULE

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Register company + admin |
| `POST` | `/api/v1/auth/login` | Public | Login, get JWT tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh access token |
| `GET`  | `/api/v1/auth/me` | Bearer | Get current user profile |
| `PUT`  | `/api/v1/auth/change-password` | Bearer | Change password |

### POST `/api/v1/auth/register`
```json
// Request
{
  "companyName": "Acme Corporation",
  "subdomain": "acme",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "email": "admin@acme.com",
  "password": "Password123!",
  "timezone": "Asia/Kolkata",
  "currency": "INR"
}

// Response 201
{
  "success": true,
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corporation", "subdomain": "acme" },
    "user": { "id": "uuid", "email": "admin@acme.com", "role": "company_admin" },
    "message": "Registration successful. Verification email sent."
  }
}
```

### POST `/api/v1/auth/login`
```json
// Request
{ "email": "admin@acme.com", "password": "Password123!" }

// Response 200
{
  "success": true,
  "data": {
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 },
    "user": { "id": "uuid", "email": "admin@acme.com", "role": "company_admin", "name": "John Doe",
              "tenant": { "id": "uuid", "name": "Acme Corporation", "subdomain": "acme" } }
  }
}
```

---

## 👤 EMPLOYEES MODULE

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/api/v1/employees` | Bearer | hr_manager+ | List employees (paginated) |
| `GET` | `/api/v1/employees/stats` | Bearer | hr_manager+ | Employee statistics |
| `GET` | `/api/v1/employees/:id` | Bearer | Any | Get employee detail |
| `POST` | `/api/v1/employees` | Bearer | hr_manager+ | Create employee |
| `PUT` | `/api/v1/employees/:id` | Bearer | hr_manager+ | Update employee |
| `DELETE` | `/api/v1/employees/:id` | Bearer | company_admin | Soft-delete (terminate) |

### Query Parameters for `GET /employees`
```
?page=1&limit=20&sort=createdAt&order=desc
&search=john          (searches firstName, lastName, email, employeeCode)
&departmentId=uuid    (filter by department)
&status=active        (filter by status)
&employmentType=full_time
```

### POST `/api/v1/employees`
```json
{
  "firstName": "Sarah",
  "lastName": "Wilson",
  "email": "sarah@acme.com",
  "phone": "+91-9876543210",
  "dateOfJoining": "2026-01-15",
  "departmentId": "uuid",
  "designationId": "uuid",
  "employmentType": "full_time"
}
// Employee code (NEX-0002) auto-generated
```

---

## 🏢 DEPARTMENTS MODULE

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/api/v1/departments` | Bearer | Any | List (with employee count) |
| `GET` | `/api/v1/departments/:id` | Bearer | Any | Detail + employees list |
| `POST` | `/api/v1/departments` | Bearer | hr_manager+ | Create |
| `PUT` | `/api/v1/departments/:id` | Bearer | hr_manager+ | Update |
| `DELETE` | `/api/v1/departments/:id` | Bearer | company_admin | Delete (no employees check) |

---

## ⏰ ATTENDANCE MODULE

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/v1/attendance/check-in` | Bearer | Any | Clock in (records time + IP) |
| `POST` | `/api/v1/attendance/check-out` | Bearer | Any | Clock out (calculates hours) |
| `GET` | `/api/v1/attendance/today` | Bearer | hr_manager+ | Today's full report + stats |
| `GET` | `/api/v1/attendance/my` | Bearer | Any | Own attendance history |
| `GET` | `/api/v1/attendance/report` | Bearer | hr_manager+ | Report for specific date |

### Query Parameters
```
GET /attendance/my?from=2026-03-01&to=2026-03-31
GET /attendance/report?date=2026-03-28
```

### Business Rules
- **Late detection**: Check-in after 09:15 marks status as `late`
- **One per day**: Can only check-in once per day
- **Auto-calculation**: Hours worked = checkOut - checkIn

---

## 🏖️ LEAVE MODULE

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/api/v1/leave/types` | Bearer | Any | List leave types |
| `POST` | `/api/v1/leave/types` | Bearer | hr_manager+ | Create leave type + policy |
| `POST` | `/api/v1/leave/requests` | Bearer | Any | Apply for leave |
| `GET` | `/api/v1/leave/requests` | Bearer | Any | List requests (filterable) |
| `GET` | `/api/v1/leave/requests/pending` | Bearer | manager+ | Pending approvals |
| `PUT` | `/api/v1/leave/requests/:id/approve` | Bearer | manager+ | Approve request |
| `PUT` | `/api/v1/leave/requests/:id/reject` | Bearer | manager+ | Reject request |
| `DELETE` | `/api/v1/leave/requests/:id` | Bearer | Any | Cancel own pending request |
| `GET` | `/api/v1/leave/balance/:employeeId` | Bearer | Any | Leave balance per type |
| `GET` | `/api/v1/leave/holidays` | Bearer | Any | List holidays |
| `POST` | `/api/v1/leave/holidays` | Bearer | hr_manager+ | Add holiday |

### POST `/api/v1/leave/requests`
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2026-04-01",
  "endDate": "2026-04-03",
  "reason": "Family vacation",
  "isHalfDay": false
}
```

### GET `/api/v1/leave/balance/:employeeId` Response
```json
[
  { "leaveType": "Casual Leave", "code": "CL", "total": 12, "used": 5, "pending": 1, "remaining": 6 },
  { "leaveType": "Sick Leave", "code": "SL", "total": 6, "used": 3, "pending": 0, "remaining": 3 },
  { "leaveType": "Earned Leave", "code": "EL", "total": 15, "used": 2, "pending": 0, "remaining": 13 }
]
```

---

## 💰 PAYROLL MODULE

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `GET` | `/api/v1/payroll/structures` | Bearer | hr_manager+ | List salary structures |
| `POST` | `/api/v1/payroll/structures` | Bearer | hr_manager+ | Create salary structure |
| `GET` | `/api/v1/payroll/runs` | Bearer | hr_manager+ | List payroll runs |
| `POST` | `/api/v1/payroll/run` | Bearer | hr_manager+ | Run payroll for month |
| `GET` | `/api/v1/payroll/runs/:id` | Bearer | hr_manager+ | Run detail + all payslips |
| `GET` | `/api/v1/payroll/payslips/:id` | Bearer | Any | Individual payslip |
| `GET` | `/api/v1/payroll/my-payslips` | Bearer | Any | Own payslips history |

### POST `/api/v1/payroll/run`
```json
{ "month": 3, "year": 2026 }
// Auto-generates payslips for all active employees with salary structures
// Calculates: gross = basic + allowances, deductions, tax (10%), net
```

---

## Total Endpoints: ~30 active

| Module | Endpoints |
|---|---|
| Auth | 5 |
| Employees | 6 |
| Departments | 5 |
| Attendance | 5 |
| Leave | 11 |
| Payroll | 7 |
| **Total** | **39** |

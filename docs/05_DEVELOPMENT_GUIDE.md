# 🛠️ DEVELOPMENT GUIDE

## Prerequisites
- **Node.js** 18+ (LTS)
- **npm** 9+
- No database installation needed (SQLite is file-based)

---

## Quick Start

### 1. Start the Backend
```powershell
cd backend
npm install              # Install dependencies (first time only)
npx prisma db push       # Create/update SQLite database
npx prisma generate      # Generate Prisma client
npm run start:dev        # Start NestJS in watch mode → http://localhost:3000
```

### 2. Start the Frontend
```powershell
cd frontend
npm install              # Install dependencies (first time only)
npm run dev              # Start Next.js → http://localhost:3001
```

### 3. Open Swagger
```
http://localhost:3000/api/docs
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="nexora-jwt-secret-dev-2026"
JWT_REFRESH_SECRET="nexora-refresh-secret-dev-2026"
PORT=3000
```

### Frontend (`frontend/.env.local`) — Future
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## Common Commands

### Backend
```powershell
# Development
npm run start:dev          # Watch mode with hot-reload
npm run start:debug        # Debug mode
npm run build              # Production build

# Database
npx prisma studio          # Visual database browser (GUI)
npx prisma db push         # Sync schema to database (no migration)
npx prisma migrate dev     # Create migration (for production-ready changes)
npx prisma generate        # Regenerate client after schema changes

# Testing
npm run test               # Unit tests
npm run test:e2e           # End-to-end tests
```

### Frontend
```powershell
npm run dev                # Development server
npm run build              # Production build
npm run start              # Start production server
```

---

## Testing the API (Quick Test Flow)

### Step 1: Register a Company
```powershell
curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "companyName": "Acme Corp",
    "subdomain": "acme",
    "adminFirstName": "John",
    "adminLastName": "Doe",
    "email": "admin@acme.com",
    "password": "Password123!"
  }'
```

### Step 2: Login
```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email": "admin@acme.com", "password": "Password123!"}'
# Copy the accessToken from the response
```

### Step 3: Use Token for Protected Endpoints
```powershell
# Replace <TOKEN> with the accessToken from login
curl http://localhost:3000/api/v1/employees `
  -H "Authorization: Bearer <TOKEN>"

curl http://localhost:3000/api/v1/departments `
  -H "Authorization: Bearer <TOKEN>"

curl -X POST http://localhost:3000/api/v1/attendance/check-in `
  -H "Authorization: Bearer <TOKEN>"
```

---

## Database Management

### View Data (Prisma Studio)
```powershell
cd backend
npx prisma studio
# Opens visual DB browser at http://localhost:5555
```

### Reset Database
```powershell
cd backend
Remove-Item prisma/dev.db         # Delete the database
npx prisma db push                # Recreate with fresh schema
# Register again to seed data
```

### Switch to PostgreSQL (Production)
1. Install PostgreSQL
2. Update `prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
3. Update `prisma.config.ts`: set `url` to PostgreSQL connection string
4. Run `npx prisma migrate dev` to create migrations
5. Run `npx prisma db push` to sync schema

---

## Adding a New Module (Template)

### 1. Create files
```
src/modules/my-feature/
├── my-feature.module.ts
├── my-feature.controller.ts
├── my-feature.service.ts
└── dto/
    └── my-feature.dto.ts
```

### 2. Module template
```typescript
// my-feature.module.ts
import { Module } from '@nestjs/common';
import { MyFeatureController } from './my-feature.controller';
import { MyFeatureService } from './my-feature.service';

@Module({
  controllers: [MyFeatureController],
  providers: [MyFeatureService],
  exports: [MyFeatureService],
})
export class MyFeatureModule {}
```

### 3. Register in `app.module.ts`
```typescript
import { MyFeatureModule } from './modules/my-feature/my-feature.module';

@Module({
  imports: [..., MyFeatureModule],
})
```

### 4. Service template
```typescript
// Always include tenantId for multi-tenant isolation
async findAll(tenantId: string) {
  return this.prisma.myModel.findMany({ where: { tenantId } });
}
```

---

## Project Roadmap

### ✅ Phase 1: Frontend (Complete)
- Landing page, auth flow, 17 dashboard pages
- Dark-mode glassmorphism design system
- All pages with mock data

### 🔧 Phase 2: Backend Core (Current — Sprint 5)
- [x] NestJS project setup
- [x] Prisma schema (18 models)
- [x] Auth module (register/login/JWT)
- [x] Employee CRUD
- [x] Department CRUD
- [x] Attendance (check-in/out)
- [x] Leave (types, requests, balance)
- [x] Payroll (structures, runs, payslips)
- [ ] **Fix server startup** (Prisma connection)
- [ ] **Test all endpoints**
- [ ] **Seed demo data**

### ⏳ Phase 3: Frontend Integration
- Replace mock data with real API calls
- Add auth context (JWT storage, auto-refresh)
- Connect all dashboard pages to backend APIs
- Real-time notification updates (future)

### ⏳ Phase 4: Production Readiness
- Switch to PostgreSQL
- Add Redis for caching/sessions
- Email service (Nodemailer)
- File uploads (S3)
- Rate limiting
- Notification module
- Audit logging
- Stripe billing integration

---

## Key Files Reference

| File | Purpose |
|---|---|
| `backend/prisma/schema.prisma` | Database schema definition |
| `backend/src/main.ts` | App bootstrap, Swagger, CORS |
| `backend/src/app.module.ts` | Root module, global guards |
| `backend/src/prisma/prisma.service.ts` | Database connection |
| `backend/src/common/guards/jwt-auth.guard.ts` | JWT authentication |
| `backend/src/common/guards/roles.guard.ts` | Role authorization |
| `backend/src/modules/auth/auth.service.ts` | Registration + Login logic |
| `backend/src/modules/auth/jwt.strategy.ts` | JWT token validation |
| `docs/` | All developer documentation |

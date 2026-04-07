import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { seedSystemRoles, assignRoleToUser } from '../src/modules/roles/seeds/seed-roles';
import { LEGACY_ROLE_MAP } from '../src/modules/roles/constants/permissions.constants';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

const DEMO_EMPLOYEES = [
  { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@acme.com', gender: 'female', phone: '+91-9876543201', dept: 'Engineering', designation: 'Senior Developer', type: 'full_time' },
  { firstName: 'Rahul', lastName: 'Patel', email: 'rahul.patel@acme.com', gender: 'male', phone: '+91-9876543202', dept: 'Engineering', designation: 'Lead', type: 'full_time' },
  { firstName: 'Ananya', lastName: 'Gupta', email: 'ananya.gupta@acme.com', gender: 'female', phone: '+91-9876543203', dept: 'Design', designation: 'Mid Developer', type: 'full_time' },
  { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@acme.com', gender: 'male', phone: '+91-9876543204', dept: 'HR', designation: 'Manager', type: 'full_time' },
  { firstName: 'Meera', lastName: 'Reddy', email: 'meera.reddy@acme.com', gender: 'female', phone: '+91-9876543205', dept: 'Finance', designation: 'Senior Developer', type: 'full_time' },
  { firstName: 'Arjun', lastName: 'Kumar', email: 'arjun.kumar@acme.com', gender: 'male', phone: '+91-9876543206', dept: 'Marketing', designation: 'Mid Developer', type: 'full_time' },
  { firstName: 'Diya', lastName: 'Nair', email: 'diya.nair@acme.com', gender: 'female', phone: '+91-9876543207', dept: 'Engineering', designation: 'Junior Developer', type: 'full_time' },
  { firstName: 'Karthik', lastName: 'Iyer', email: 'karthik.iyer@acme.com', gender: 'male', phone: '+91-9876543208', dept: 'Sales', designation: 'Manager', type: 'full_time' },
  { firstName: 'Sneha', lastName: 'Joshi', email: 'sneha.joshi@acme.com', gender: 'female', phone: '+91-9876543209', dept: 'Support', designation: 'Mid Developer', type: 'full_time' },
  { firstName: 'Rohan', lastName: 'Verma', email: 'rohan.verma@acme.com', gender: 'male', phone: '+91-9876543210', dept: 'Engineering', designation: 'Intern', type: 'intern' },
  { firstName: 'Aisha', lastName: 'Khan', email: 'aisha.khan@acme.com', gender: 'female', phone: '+91-9876543211', dept: 'HR', designation: 'Junior Developer', type: 'full_time' },
  { firstName: 'Devendra', lastName: 'Mishra', email: 'devendra.mishra@acme.com', gender: 'male', phone: '+91-9876543212', dept: 'Engineering', designation: 'Director', type: 'full_time' },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  // Find the first tenant (created during registration)
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ No tenant found. Register first via POST /api/v1/auth/register');
    process.exit(1);
  }
  console.log(`📦 Tenant: ${tenant.name} (${tenant.subdomain})`);

  // Get departments and designations
  const departments = await prisma.department.findMany({ where: { tenantId: tenant.id } });
  const designations = await prisma.designation.findMany({ where: { tenantId: tenant.id } });
  const shifts = await prisma.shift.findMany({ where: { tenantId: tenant.id } });
  const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId: tenant.id } });

  const deptMap = Object.fromEntries(departments.map(d => [d.name, d.id]));
  const desigMap = Object.fromEntries(designations.map(d => [d.name, d.id]));
  const defaultShift = shifts.find(s => s.isDefault) || shifts[0];

  // Create salary structures
  const structures = [
    { name: 'Junior Package', baseSalary: 35000, allowances: JSON.stringify([{name:'HRA',value:8750},{name:'Travel',value:2000}]), deductions: JSON.stringify([{name:'PF',value:4200},{name:'ESI',value:875}]) },
    { name: 'Mid-Level Package', baseSalary: 55000, allowances: JSON.stringify([{name:'HRA',value:13750},{name:'Travel',value:3500},{name:'Medical',value:1500}]), deductions: JSON.stringify([{name:'PF',value:6600},{name:'ESI',value:1100}]) },
    { name: 'Senior Package', baseSalary: 80000, allowances: JSON.stringify([{name:'HRA',value:20000},{name:'Travel',value:5000},{name:'Medical',value:2500}]), deductions: JSON.stringify([{name:'PF',value:9600},{name:'ESI',value:1800}]) },
    { name: 'Manager Package', baseSalary: 100000, allowances: JSON.stringify([{name:'HRA',value:25000},{name:'Travel',value:8000},{name:'Medical',value:3000},{name:'Special',value:5000}]), deductions: JSON.stringify([{name:'PF',value:12000},{name:'ESI',value:2000}]) },
    { name: 'Director Package', baseSalary: 150000, allowances: JSON.stringify([{name:'HRA',value:37500},{name:'Travel',value:12000},{name:'Medical',value:5000},{name:'Special',value:10000}]), deductions: JSON.stringify([{name:'PF',value:18000},{name:'ESI',value:3000}]) },
  ];

  const structMap: Record<string, string> = {};
  for (const s of structures) {
    const existing = await prisma.salaryStructure.findFirst({ where: { tenantId: tenant.id, name: s.name } });
    if (!existing) {
      const created = await prisma.salaryStructure.create({ data: { tenantId: tenant.id, ...s } });
      structMap[s.name] = created.id;
      console.log(`  💰 Created salary structure: ${s.name}`);
    } else {
      structMap[s.name] = existing.id;
    }
  }

  // Map designation to salary structure
  const salaryMap: Record<string, string> = {
    'Intern': structMap['Junior Package'],
    'Junior Developer': structMap['Junior Package'],
    'Mid Developer': structMap['Mid-Level Package'],
    'Senior Developer': structMap['Senior Package'],
    'Lead': structMap['Senior Package'],
    'Manager': structMap['Manager Package'],
    'Director': structMap['Director Package'],
    'VP': structMap['Director Package'],
    'CXO': structMap['Director Package'],
  };

  // Create employees with user accounts
  const passwordHash = await bcrypt.hash('Demo123!', 12);
  let codeNum = 2; // NEX-0001 is admin

  // Check existing employees
  const existingCount = await prisma.employee.count({ where: { tenantId: tenant.id } });
  codeNum = existingCount + 1;

  console.log(`\n👥 Creating ${DEMO_EMPLOYEES.length} demo employees...`);

  for (const emp of DEMO_EMPLOYEES) {
    const existing = await prisma.employee.findFirst({ where: { tenantId: tenant.id, email: emp.email } });
    if (existing) {
      console.log(`  ⏭️  Skipped ${emp.firstName} ${emp.lastName} (already exists)`);
      continue;
    }

    // Create user account
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: emp.email,
        passwordHash,
        role: emp.designation === 'Manager' || emp.designation === 'Director' ? 'manager' : 'employee',
        isActive: true,
        isVerified: true,
      },
    });

    const employeeCode = `NEX-${codeNum.toString().padStart(4, '0')}`;
    const joiningDate = new Date(2024 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        gender: emp.gender,
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        departmentId: deptMap[emp.dept],
        designationId: desigMap[emp.designation],
        salaryStructureId: salaryMap[emp.designation],
        shiftId: defaultShift?.id,
        dateOfJoining: joiningDate,
        employmentType: emp.type,
        status: 'active',
        city: ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'][Math.floor(Math.random() * 6)],
        country: 'India',
      },
    });

    codeNum++;
    console.log(`  ✅ Created ${emp.firstName} ${emp.lastName} (${employeeCode}) — ${emp.dept}, ${emp.designation}`);
  }

  // ─── Seed RBAC Roles & Assign to Users ───────────────────────
  console.log('\n🔐 Seeding RBAC roles & permissions...');
  const roleMap = await seedSystemRoles(prisma as any, tenant.id);

  // Assign roles to all users based on their legacy role field
  console.log('\n🎭 Assigning roles to users...');
  const allUsers = await prisma.user.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, email: true, role: true },
  });

  for (const u of allUsers) {
    // Check if user already has a role assignment
    const existingAssignment = await prisma.userRole.findFirst({
      where: { userId: u.id },
    });
    if (existingAssignment) {
      console.log(`  ⏭️  ${u.email} already has a role assigned`);
      continue;
    }

    const systemRoleSlug = LEGACY_ROLE_MAP[u.role] || 'employee';
    const systemRoleId = roleMap[systemRoleSlug];
    if (systemRoleId) {
      await assignRoleToUser(prisma as any, u.id, systemRoleId);
      console.log(`  🎭 ${u.email} → ${systemRoleSlug}`);
    }
  }

  // Create attendance records for the last 7 days
  console.log('\n⏰ Creating attendance records...');
  const allEmployees = await prisma.employee.findMany({ where: { tenantId: tenant.id, status: 'active' } });

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const emp of allEmployees) {
      const existing = await prisma.attendanceRecord.findFirst({ where: { tenantId: tenant.id, employeeId: emp.id, date } });
      if (existing) continue;

      // 85% present, 10% late, 5% absent
      const roll = Math.random();
      if (roll > 0.95) continue; // absent

      const isLate = roll > 0.85;
      const checkInHour = isLate ? 9 + Math.floor(Math.random() * 2) : 8 + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMin, 0, 0);

      const hoursWorked = 7 + Math.random() * 3; // 7-10 hours
      const checkOut = new Date(checkIn.getTime() + hoursWorked * 3600000);

      await prisma.attendanceRecord.create({
        data: {
          tenantId: tenant.id,
          employeeId: emp.id,
          date,
          checkIn,
          checkOut: daysAgo === 0 ? null : checkOut, // Today: no checkout yet
          hoursWorked: daysAgo === 0 ? null : Math.round(hoursWorked * 100) / 100,
          status: isLate ? 'late' : 'present',
          source: 'web',
        },
      });
    }
    console.log(`  📅 ${date.toISOString().split('T')[0]}: attendance created`);
  }

  // Create some leave requests
  console.log('\n🏖️ Creating leave requests...');
  const casualLeave = leaveTypes.find(lt => lt.code === 'CL');
  const sickLeave = leaveTypes.find(lt => lt.code === 'SL');

  if (casualLeave && allEmployees.length > 2) {
    // Approved leave for employee[2]
    await prisma.leaveRequest.create({
      data: {
        tenantId: tenant.id, employeeId: allEmployees[2].id, leaveTypeId: casualLeave.id,
        startDate: new Date(2026, 2, 10), endDate: new Date(2026, 2, 12), days: 3,
        reason: 'Family function', status: 'approved', reviewedBy: allEmployees[0].id,
        reviewedAt: new Date(2026, 2, 8), reviewComment: 'Approved',
      },
    });
    console.log(`  ✅ Approved CL for ${allEmployees[2].firstName} (3 days)`);

    // Pending leave for employee[4]
    if (allEmployees[4]) {
      await prisma.leaveRequest.create({
        data: {
          tenantId: tenant.id, employeeId: allEmployees[4].id, leaveTypeId: casualLeave.id,
          startDate: new Date(2026, 3, 5), endDate: new Date(2026, 3, 7), days: 3,
          reason: 'Vacation', status: 'pending',
        },
      });
      console.log(`  ⏳ Pending CL for ${allEmployees[4].firstName} (3 days)`);
    }
  }

  if (sickLeave && allEmployees.length > 6) {
    await prisma.leaveRequest.create({
      data: {
        tenantId: tenant.id, employeeId: allEmployees[6].id, leaveTypeId: sickLeave.id,
        startDate: new Date(2026, 2, 20), endDate: new Date(2026, 2, 21), days: 2,
        reason: 'Not feeling well', status: 'approved', reviewedBy: allEmployees[0].id,
        reviewedAt: new Date(2026, 2, 19),
      },
    });
    console.log(`  ✅ Approved SL for ${allEmployees[6].firstName} (2 days)`);
  }

  // Create holidays
  console.log('\n🎉 Creating holidays...');
  const holidays = [
    { name: 'Republic Day', date: new Date(2026, 0, 26) },
    { name: 'Holi', date: new Date(2026, 2, 17) },
    { name: 'Good Friday', date: new Date(2026, 3, 3) },
    { name: 'Eid ul-Fitr', date: new Date(2026, 3, 21) },
    { name: 'Independence Day', date: new Date(2026, 7, 15) },
    { name: 'Gandhi Jayanti', date: new Date(2026, 9, 2) },
    { name: 'Diwali', date: new Date(2026, 10, 8) },
    { name: 'Christmas', date: new Date(2026, 11, 25) },
  ];

  for (const h of holidays) {
    const existing = await prisma.holiday.findFirst({ where: { tenantId: tenant.id, name: h.name } });
    if (!existing) {
      await prisma.holiday.create({ data: { tenantId: tenant.id, ...h } });
      console.log(`  🎊 ${h.name} — ${h.date.toISOString().split('T')[0]}`);
    }
  }

  // Run payroll for Feb & March
  console.log('\n💰 Running payroll...');
  for (const { month, year } of [{ month: 2, year: 2026 }, { month: 3, year: 2026 }]) {
    const existing = await prisma.payrollRun.findFirst({ where: { tenantId: tenant.id, month, year } });
    if (existing) {
      console.log(`  ⏭️  Payroll ${month}/${year} already exists`);
      continue;
    }

    const empsWithSalary = await prisma.employee.findMany({
      where: { tenantId: tenant.id, status: 'active', salaryStructureId: { not: null } },
      include: { salaryStructure: true },
    });

    const run = await prisma.payrollRun.create({
      data: { tenantId: tenant.id, month, year, status: 'processing', totalEmployees: empsWithSalary.length },
    });

    let totalGross = 0, totalDeductions = 0, totalNet = 0;
    for (const emp of empsWithSalary) {
      if (!emp.salaryStructure) continue;
      const s = emp.salaryStructure;
      const allowances = JSON.parse(s.allowances || '[]');
      const deductions = JSON.parse(s.deductions || '[]');
      const allowTotal = allowances.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
      const deductTotal = deductions.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      const gross = s.baseSalary + allowTotal;
      const tax = Math.round(gross * 0.1);
      const net = gross - deductTotal - tax;

      await prisma.payslip.create({
        data: {
          tenantId: tenant.id, employeeId: emp.id, payrollRunId: run.id,
          grossSalary: gross, earnings: JSON.stringify([{ name: 'Basic', amount: s.baseSalary }, ...allowances]),
          deductionsDetail: JSON.stringify([...deductions, { name: 'Tax', amount: tax }]),
          totalDeductions: deductTotal + tax, tax, netSalary: net,
          workingDays: 22, daysWorked: 21 + Math.random(), lopDays: 0,
        },
      });
      totalGross += gross; totalDeductions += deductTotal + tax; totalNet += net;
    }

    await prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: 'completed', totalGross, totalDeductions, totalNet, processedAt: new Date() },
    });
    console.log(`  ✅ Payroll ${month}/${year}: ${empsWithSalary.length} employees, Net: ₹${totalNet.toLocaleString()}`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('📊 Summary:');
  const counts = {
    employees: await prisma.employee.count({ where: { tenantId: tenant.id } }),
    departments: await prisma.department.count({ where: { tenantId: tenant.id } }),
    attendance: await prisma.attendanceRecord.count({ where: { tenantId: tenant.id } }),
    leaveRequests: await prisma.leaveRequest.count({ where: { tenantId: tenant.id } }),
    holidays: await prisma.holiday.count({ where: { tenantId: tenant.id } }),
    payrollRuns: await prisma.payrollRun.count({ where: { tenantId: tenant.id } }),
    payslips: await prisma.payslip.count({ where: { tenantId: tenant.id } }),
    roles: await prisma.role.count({ where: { tenantId: tenant.id } }),
    userRoles: await prisma.userRole.count(),
    permissions: await prisma.permission.count(),
  };
  console.table(counts);
  console.log('\n🔑 All demo employees use password: Demo123!');

  await prisma.$disconnect();
}

seed().catch(console.error);

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildScopeFilter } from '../roles/data-scope.util';

const emptyToday = () => ({
  records: [] as any[],
  stats: { totalEmployees: 0, present: 0, late: 0, absent: 0, onLeave: 0 },
});

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(tenantId: string, employeeId: string, ipAddress?: string) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile is linked to this account. Contact HR.');
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
    if (existing?.checkIn) throw new BadRequestException('Already checked in today');

    if (existing) {
      return this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkIn: new Date(), ipAddress, source: 'web' } });
    }
    // Determine if late (after 09:15 = grace)
    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

    return this.prisma.attendanceRecord.create({
      data: { tenantId, employeeId, date: today, checkIn: new Date(), status: isLate ? 'late' : 'present', ipAddress, source: 'web' },
    });
  }

  async checkOut(tenantId: string, employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('No employee profile is linked to this account. Contact HR.');
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await this.prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
    if (!record || !record.checkIn) throw new BadRequestException('No check-in found for today');
    if (record.checkOut) throw new BadRequestException('Already checked out today');

    const checkOut = new Date();
    const hoursWorked = (checkOut.getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOut, hoursWorked: Math.round(hoursWorked * 100) / 100 },
    });
  }

  async getToday(user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const scope = user.dataScopes?.['attendance'] || 'self';
    // Attendance rows are keyed by employeeId only. buildScopeFilter('self'|…) without employeeId
    // would use userId, which AttendanceRecord does not have → Prisma errors.
    if (!user.employeeId && scope !== 'all') {
      return emptyToday();
    }

    const filter = buildScopeFilter(scope, user, { employeeField: 'employeeId' });
    const where: any = { ...filter, tenantId: user.tenantId, date: today };

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
      orderBy: { checkIn: 'asc' },
    });

    const totalEmployeesWhere: any = { ...buildScopeFilter(scope, user, { employeeField: 'id' }), tenantId: user.tenantId, status: 'active' };
    const totalEmployees = await this.prisma.employee.count({ where: totalEmployeesWhere });
    const present = records.filter((r: (typeof records)[number]) => r.status === 'present').length;
    const late = records.filter((r: (typeof records)[number]) => r.status === 'late').length;
    const absent = totalEmployees - records.length;

    return { records, stats: { totalEmployees, present, late, absent, onLeave: 0 } };
  }

  async getEmployeeAttendance(tenantId: string, employeeId: string, from?: string, to?: string) {
    const where: any = { tenantId, employeeId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    return this.prisma.attendanceRecord.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getReport(user: any, date: string) {
    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0);
    const scope = user.dataScopes?.['attendance'] || 'self';
    if (!user.employeeId && scope !== 'all') {
      return [];
    }
    const filter = buildScopeFilter(scope, user, { employeeField: 'employeeId' });
    const where: any = { ...filter, tenantId: user.tenantId, date: targetDate };

    return this.prisma.attendanceRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
  }

  // ======================== DATE-RANGE REPORT ========================

  async getDateRangeReport(
    user: any,
    from: string,
    to: string,
    filters?: { departmentId?: string; employeeId?: string; status?: string },
  ) {
    if (!from || !to) throw new BadRequestException('Both "from" and "to" query params are required.');

    const startDate = new Date(from); startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(to); endDate.setHours(23, 59, 59, 999);
    if (startDate > endDate) throw new BadRequestException('"from" must be before or equal to "to".');

    const scope = user.dataScopes?.['attendance'] || 'self';
    if (!user.employeeId && scope !== 'all') {
      return { records: [], summary: [], stats: { totalRecords: 0, totalPresent: 0, totalLate: 0, totalAbsent: 0, avgHours: 0 } };
    }

    const scopeFilter = buildScopeFilter(scope, user, { employeeField: 'employeeId' });
    const where: any = {
      ...scopeFilter,
      tenantId: user.tenantId,
      date: { gte: startDate, lte: endDate },
    };

    // Optional filters
    if (filters?.status && filters.status !== 'all') where.status = filters.status;
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.departmentId) {
      where.employee = { ...where.employee, departmentId: filters.departmentId };
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'asc' }],
    });

    // ---- Build per-employee summary ----
    const empMap = new Map<string, {
      employeeId: string; firstName: string; lastName: string; employeeCode: string; department: string;
      totalDays: number; presentDays: number; lateDays: number; absentDays: number;
      totalHours: number; avgCheckIn: number; checkInCount: number;
    }>();

    for (const r of records) {
      const empId = r.employeeId;
      if (!empMap.has(empId)) {
        empMap.set(empId, {
          employeeId: empId,
          firstName: (r as any).employee?.firstName || '',
          lastName: (r as any).employee?.lastName || '',
          employeeCode: (r as any).employee?.employeeCode || '',
          department: (r as any).employee?.department?.name || '—',
          totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0,
          totalHours: 0, avgCheckIn: 0, checkInCount: 0,
        });
      }
      const emp = empMap.get(empId)!;
      emp.totalDays++;
      if (r.status === 'present') emp.presentDays++;
      else if (r.status === 'late') { emp.lateDays++; emp.presentDays++; } // late is still present
      else if (r.status === 'absent') emp.absentDays++;
      if (r.hoursWorked) emp.totalHours += r.hoursWorked;
      if (r.checkIn) { emp.avgCheckIn += new Date(r.checkIn).getHours() * 60 + new Date(r.checkIn).getMinutes(); emp.checkInCount++; }
    }

    const summary = Array.from(empMap.values()).map((emp) => {
      const avgCheckInMin = emp.checkInCount > 0 ? Math.round(emp.avgCheckIn / emp.checkInCount) : 0;
      const avgCheckInFormatted = emp.checkInCount > 0
        ? `${String(Math.floor(avgCheckInMin / 60)).padStart(2, '0')}:${String(avgCheckInMin % 60).padStart(2, '0')}`
        : '—';
      const avgHours = emp.totalDays > 0 ? Math.round((emp.totalHours / emp.totalDays) * 100) / 100 : 0;
      const punctuality = emp.totalDays > 0 ? Math.round(((emp.totalDays - emp.lateDays) / emp.totalDays) * 100) : 0;
      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        department: emp.department,
        totalDays: emp.totalDays,
        presentDays: emp.presentDays,
        lateDays: emp.lateDays,
        absentDays: emp.absentDays,
        totalHours: Math.round(emp.totalHours * 100) / 100,
        avgHoursPerDay: avgHours,
        avgCheckIn: avgCheckInFormatted,
        punctuality,
      };
    });

    // ---- Overall stats ----
    const totalPresent = records.filter((r) => r.status === 'present').length;
    const totalLate = records.filter((r) => r.status === 'late').length;
    const totalAbsent = records.filter((r) => r.status === 'absent').length;
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const avgHours = records.length > 0 ? Math.round((totalHours / records.length) * 100) / 100 : 0;

    // Count working days in range (exclude weekends)
    let workingDays = 0;
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) workingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        hoursWorked: r.hoursWorked,
        status: r.status,
        source: r.source,
        employeeId: r.employeeId,
        employeeName: `${(r as any).employee?.firstName || ''} ${(r as any).employee?.lastName || ''}`.trim(),
        employeeCode: (r as any).employee?.employeeCode || '',
        department: (r as any).employee?.department?.name || '—',
      })),
      summary,
      stats: {
        totalRecords: records.length,
        totalPresent,
        totalLate,
        totalAbsent,
        avgHours,
        workingDays,
        uniqueEmployees: empMap.size,
      },
    };
  }

  // ======================== CSV EXPORT ========================

  async getDateRangeReportCsv(
    user: any,
    from: string,
    to: string,
    filters?: { departmentId?: string; employeeId?: string; status?: string },
  ): Promise<string> {
    const report = await this.getDateRangeReport(user, from, to, filters);

    const headers = ['Date', 'Employee Code', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Hours Worked', 'Status'];
    const rows = report.records.map((r: any) => [
      new Date(r.date).toISOString().split('T')[0],
      r.employeeCode,
      r.employeeName,
      r.department,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
      r.hoursWorked?.toFixed(2) || '',
      r.status,
    ]);

    const csvLines = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))];
    return csvLines.join('\n');
  }
}

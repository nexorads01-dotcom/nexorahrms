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
}

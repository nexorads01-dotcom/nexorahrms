import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(tenantId: string, employeeId: string, ipAddress?: string) {
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

  async getToday(tenantId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId, date: today },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
      orderBy: { checkIn: 'asc' },
    });

    const totalEmployees = await this.prisma.employee.count({ where: { tenantId, status: 'active' } });
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

  async getReport(tenantId: string, date: string) {
    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0);
    return this.prisma.attendanceRecord.findMany({
      where: { tenantId, date: targetDate },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
  }
}

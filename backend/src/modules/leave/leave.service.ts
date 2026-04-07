import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildScopeFilter } from '../roles/data-scope.util';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  // ===== LEAVE TYPES =====
  async getLeaveTypes(tenantId: string) {
    return this.prisma.leaveType.findMany({ where: { tenantId, isActive: true }, include: { policies: true } });
  }

  async createLeaveType(tenantId: string, data: { name: string; code: string; color?: string; isPaid?: boolean; annualQuota: number }) {
    const leaveType = await this.prisma.leaveType.create({
      data: { tenantId, name: data.name, code: data.code, color: data.color || '#3b82f6', isPaid: data.isPaid ?? true },
    });
    await this.prisma.leavePolicy.create({ data: { tenantId, leaveTypeId: leaveType.id, annualQuota: data.annualQuota } });
    return leaveType;
  }

  // ===== LEAVE REQUESTS =====
  async applyLeave(tenantId: string, employeeId: string, data: { leaveTypeId: string; startDate: string; endDate: string; reason?: string; isHalfDay?: boolean }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) throw new BadRequestException('End date must be after start date');

    const days = data.isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const balance = await this.getBalance(tenantId, employeeId);
    const typeBalance = balance.find(
      (b: { leaveTypeId: string; remaining: number; allowNegative: boolean }) => b.leaveTypeId === data.leaveTypeId,
    );
    if (typeBalance && typeBalance.remaining < days && !typeBalance.allowNegative) {
      throw new BadRequestException(`Insufficient leave balance. Available: ${typeBalance.remaining} days`);
    }

    return this.prisma.leaveRequest.create({
      data: { tenantId, employeeId, leaveTypeId: data.leaveTypeId, startDate: start, endDate: end, days, isHalfDay: data.isHalfDay || false, reason: data.reason },
      include: { leaveType: { select: { name: true, code: true } } },
    });
  }

  async getRequests(user: any, filters?: { status?: string; employeeId?: string }) {
    const scope = user.dataScopes?.['leaves'] || 'self';
    const filter = buildScopeFilter(scope, user, { employeeField: 'employeeId' });
    const where: any = { ...filter, tenantId: user.tenantId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
        leaveType: { select: { name: true, code: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveLeave(tenantId: string, requestId: string, reviewedBy: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'pending') throw new BadRequestException('Can only approve pending requests');

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'approved', reviewedBy, reviewedAt: new Date(), reviewComment: comment },
    });
  }

  async rejectLeave(tenantId: string, requestId: string, reviewedBy: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'pending') throw new BadRequestException('Can only reject pending requests');

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', reviewedBy, reviewedAt: new Date(), reviewComment: comment },
    });
  }

  async cancelLeave(tenantId: string, requestId: string, employeeId: string) {
    const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId, employeeId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'pending') throw new BadRequestException('Can only cancel pending requests');
    return this.prisma.leaveRequest.update({ where: { id: requestId }, data: { status: 'cancelled' } });
  }

  // ===== BALANCE =====
  async getBalance(tenantId: string, employeeId: string) {
    const policies = await this.prisma.leavePolicy.findMany({
      where: { tenantId },
      include: { leaveType: true },
    });

    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const used = await this.prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: { tenantId, employeeId, status: 'approved', startDate: { gte: startOfYear }, endDate: { lte: endOfYear } },
      _sum: { days: true },
    });

    const pending = await this.prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: { tenantId, employeeId, status: 'pending' },
      _sum: { days: true },
    });

    return policies.map((p: (typeof policies)[number]) => {
      const usedDays = used.find((u: (typeof used)[number]) => u.leaveTypeId === p.leaveTypeId)?._sum.days || 0;
      const pendingDays = pending.find((u: (typeof pending)[number]) => u.leaveTypeId === p.leaveTypeId)?._sum.days || 0;
      return {
        leaveTypeId: p.leaveTypeId,
        leaveType: p.leaveType.name,
        code: p.leaveType.code,
        color: p.leaveType.color,
        total: p.annualQuota,
        used: usedDays,
        pending: pendingDays,
        remaining: p.annualQuota - usedDays - pendingDays,
        allowNegative: p.allowNegative,
      };
    });
  }

  // ===== HOLIDAYS =====
  async getHolidays(tenantId: string, year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.holiday.findMany({
      where: { tenantId, date: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) } },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(tenantId: string, data: { name: string; date: string; isOptional?: boolean; description?: string }) {
    return this.prisma.holiday.create({ data: { tenantId, name: data.name, date: new Date(data.date), isOptional: data.isOptional, description: data.description } });
  }
}

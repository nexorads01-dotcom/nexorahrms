"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LeaveService = class LeaveService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLeaveTypes(tenantId) {
        return this.prisma.leaveType.findMany({ where: { tenantId, isActive: true }, include: { policies: true } });
    }
    async createLeaveType(tenantId, data) {
        const leaveType = await this.prisma.leaveType.create({
            data: { tenantId, name: data.name, code: data.code, color: data.color || '#3b82f6', isPaid: data.isPaid ?? true },
        });
        await this.prisma.leavePolicy.create({ data: { tenantId, leaveTypeId: leaveType.id, annualQuota: data.annualQuota } });
        return leaveType;
    }
    async applyLeave(tenantId, employeeId, data) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end < start)
            throw new common_1.BadRequestException('End date must be after start date');
        const days = data.isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const balance = await this.getBalance(tenantId, employeeId);
        const typeBalance = balance.find((b) => b.leaveTypeId === data.leaveTypeId);
        if (typeBalance && typeBalance.remaining < days && !typeBalance.allowNegative) {
            throw new common_1.BadRequestException(`Insufficient leave balance. Available: ${typeBalance.remaining} days`);
        }
        return this.prisma.leaveRequest.create({
            data: { tenantId, employeeId, leaveTypeId: data.leaveTypeId, startDate: start, endDate: end, days, isHalfDay: data.isHalfDay || false, reason: data.reason },
            include: { leaveType: { select: { name: true, code: true } } },
        });
    }
    async getRequests(tenantId, filters) {
        const where = { tenantId };
        if (filters?.status)
            where.status = filters.status;
        if (filters?.employeeId)
            where.employeeId = filters.employeeId;
        return this.prisma.leaveRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
                leaveType: { select: { name: true, code: true, color: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveLeave(tenantId, requestId, reviewedBy, comment) {
        const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId } });
        if (!request)
            throw new common_1.NotFoundException('Leave request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Can only approve pending requests');
        return this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: { status: 'approved', reviewedBy, reviewedAt: new Date(), reviewComment: comment },
        });
    }
    async rejectLeave(tenantId, requestId, reviewedBy, comment) {
        const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId } });
        if (!request)
            throw new common_1.NotFoundException('Leave request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Can only reject pending requests');
        return this.prisma.leaveRequest.update({
            where: { id: requestId },
            data: { status: 'rejected', reviewedBy, reviewedAt: new Date(), reviewComment: comment },
        });
    }
    async cancelLeave(tenantId, requestId, employeeId) {
        const request = await this.prisma.leaveRequest.findFirst({ where: { id: requestId, tenantId, employeeId } });
        if (!request)
            throw new common_1.NotFoundException('Leave request not found');
        if (request.status !== 'pending')
            throw new common_1.BadRequestException('Can only cancel pending requests');
        return this.prisma.leaveRequest.update({ where: { id: requestId }, data: { status: 'cancelled' } });
    }
    async getBalance(tenantId, employeeId) {
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
        return policies.map((p) => {
            const usedDays = used.find((u) => u.leaveTypeId === p.leaveTypeId)?._sum.days || 0;
            const pendingDays = pending.find((u) => u.leaveTypeId === p.leaveTypeId)?._sum.days || 0;
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
    async getHolidays(tenantId, year) {
        const y = year || new Date().getFullYear();
        return this.prisma.holiday.findMany({
            where: { tenantId, date: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) } },
            orderBy: { date: 'asc' },
        });
    }
    async createHoliday(tenantId, data) {
        return this.prisma.holiday.create({ data: { tenantId, name: data.name, date: new Date(data.date), isOptional: data.isOptional, description: data.description } });
    }
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeaveService);
//# sourceMappingURL=leave.service.js.map
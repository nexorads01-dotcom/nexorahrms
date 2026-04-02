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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIn(tenantId, employeeId, ipAddress) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
        if (existing?.checkIn)
            throw new common_1.BadRequestException('Already checked in today');
        if (existing) {
            return this.prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkIn: new Date(), ipAddress, source: 'web' } });
        }
        const now = new Date();
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
        return this.prisma.attendanceRecord.create({
            data: { tenantId, employeeId, date: today, checkIn: new Date(), status: isLate ? 'late' : 'present', ipAddress, source: 'web' },
        });
    }
    async checkOut(tenantId, employeeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const record = await this.prisma.attendanceRecord.findFirst({ where: { tenantId, employeeId, date: today } });
        if (!record || !record.checkIn)
            throw new common_1.BadRequestException('No check-in found for today');
        if (record.checkOut)
            throw new common_1.BadRequestException('Already checked out today');
        const checkOut = new Date();
        const hoursWorked = (checkOut.getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);
        return this.prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { checkOut, hoursWorked: Math.round(hoursWorked * 100) / 100 },
        });
    }
    async getToday(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const records = await this.prisma.attendanceRecord.findMany({
            where: { tenantId, date: today },
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
            orderBy: { checkIn: 'asc' },
        });
        const totalEmployees = await this.prisma.employee.count({ where: { tenantId, status: 'active' } });
        const present = records.filter((r) => r.status === 'present').length;
        const late = records.filter((r) => r.status === 'late').length;
        const absent = totalEmployees - records.length;
        return { records, stats: { totalEmployees, present, late, absent, onLeave: 0 } };
    }
    async getEmployeeAttendance(tenantId, employeeId, from, to) {
        const where = { tenantId, employeeId };
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = new Date(from);
            if (to)
                where.date.lte = new Date(to);
        }
        return this.prisma.attendanceRecord.findMany({ where, orderBy: { date: 'desc' } });
    }
    async getReport(tenantId, date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return this.prisma.attendanceRecord.findMany({
            where: { tenantId, date: targetDate },
            include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map
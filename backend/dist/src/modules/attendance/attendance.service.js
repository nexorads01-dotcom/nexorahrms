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
const data_scope_util_1 = require("../roles/data-scope.util");
const emptyToday = () => ({
    records: [],
    stats: { totalEmployees: 0, present: 0, late: 0, absent: 0, onLeave: 0 },
});
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIn(tenantId, employeeId, ipAddress) {
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee profile is linked to this account. Contact HR.');
        }
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
        if (!employeeId) {
            throw new common_1.BadRequestException('No employee profile is linked to this account. Contact HR.');
        }
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
    async getToday(user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scope = user.dataScopes?.['attendance'] || 'self';
        if (!user.employeeId && scope !== 'all') {
            return emptyToday();
        }
        const filter = (0, data_scope_util_1.buildScopeFilter)(scope, user, { employeeField: 'employeeId' });
        const where = { ...filter, tenantId: user.tenantId, date: today };
        const records = await this.prisma.attendanceRecord.findMany({
            where,
            include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
            orderBy: { checkIn: 'asc' },
        });
        const totalEmployeesWhere = { ...(0, data_scope_util_1.buildScopeFilter)(scope, user, { employeeField: 'id' }), tenantId: user.tenantId, status: 'active' };
        const totalEmployees = await this.prisma.employee.count({ where: totalEmployeesWhere });
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
    async getReport(user, date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const scope = user.dataScopes?.['attendance'] || 'self';
        if (!user.employeeId && scope !== 'all') {
            return [];
        }
        const filter = (0, data_scope_util_1.buildScopeFilter)(scope, user, { employeeField: 'employeeId' });
        const where = { ...filter, tenantId: user.tenantId, date: targetDate };
        return this.prisma.attendanceRecord.findMany({
            where,
            include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
        });
    }
    async getDateRangeReport(user, from, to, filters) {
        if (!from || !to)
            throw new common_1.BadRequestException('Both "from" and "to" query params are required.');
        const startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        if (startDate > endDate)
            throw new common_1.BadRequestException('"from" must be before or equal to "to".');
        const scope = user.dataScopes?.['attendance'] || 'self';
        if (!user.employeeId && scope !== 'all') {
            return { records: [], summary: [], stats: { totalRecords: 0, totalPresent: 0, totalLate: 0, totalAbsent: 0, avgHours: 0 } };
        }
        const scopeFilter = (0, data_scope_util_1.buildScopeFilter)(scope, user, { employeeField: 'employeeId' });
        const where = {
            ...scopeFilter,
            tenantId: user.tenantId,
            date: { gte: startDate, lte: endDate },
        };
        if (filters?.status && filters.status !== 'all')
            where.status = filters.status;
        if (filters?.employeeId)
            where.employeeId = filters.employeeId;
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
        const empMap = new Map();
        for (const r of records) {
            const empId = r.employeeId;
            if (!empMap.has(empId)) {
                empMap.set(empId, {
                    employeeId: empId,
                    firstName: r.employee?.firstName || '',
                    lastName: r.employee?.lastName || '',
                    employeeCode: r.employee?.employeeCode || '',
                    department: r.employee?.department?.name || '—',
                    totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0,
                    totalHours: 0, avgCheckIn: 0, checkInCount: 0,
                });
            }
            const emp = empMap.get(empId);
            emp.totalDays++;
            if (r.status === 'present')
                emp.presentDays++;
            else if (r.status === 'late') {
                emp.lateDays++;
                emp.presentDays++;
            }
            else if (r.status === 'absent')
                emp.absentDays++;
            if (r.hoursWorked)
                emp.totalHours += r.hoursWorked;
            if (r.checkIn) {
                emp.avgCheckIn += new Date(r.checkIn).getHours() * 60 + new Date(r.checkIn).getMinutes();
                emp.checkInCount++;
            }
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
        const totalPresent = records.filter((r) => r.status === 'present').length;
        const totalLate = records.filter((r) => r.status === 'late').length;
        const totalAbsent = records.filter((r) => r.status === 'absent').length;
        const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
        const avgHours = records.length > 0 ? Math.round((totalHours / records.length) * 100) / 100 : 0;
        let workingDays = 0;
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const dow = cursor.getDay();
            if (dow !== 0 && dow !== 6)
                workingDays++;
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
                employeeName: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
                employeeCode: r.employee?.employeeCode || '',
                department: r.employee?.department?.name || '—',
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
    async getDateRangeReportCsv(user, from, to, filters) {
        const report = await this.getDateRangeReport(user, from, to, filters);
        const headers = ['Date', 'Employee Code', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Hours Worked', 'Status'];
        const rows = report.records.map((r) => [
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
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map
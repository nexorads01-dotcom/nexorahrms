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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const decorators_1 = require("../../common/decorators");
const permissions_decorator_1 = require("../roles/permissions.decorator");
let AttendanceController = class AttendanceController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    checkIn(tenantId, employeeId, req) {
        return this.svc.checkIn(tenantId, employeeId, req.ip);
    }
    checkOut(tenantId, employeeId) {
        return this.svc.checkOut(tenantId, employeeId);
    }
    getToday(user) { return this.svc.getToday(user); }
    getMyAttendance(tenantId, employeeId, from, to) {
        return this.svc.getEmployeeAttendance(tenantId, employeeId, from, to);
    }
    getDateRangeReport(user, from, to, departmentId, employeeId, status) {
        return this.svc.getDateRangeReport(user, from, to, { departmentId, employeeId, status });
    }
    async getDateRangeReportCsv(user, from, to, departmentId, employeeId, status, res) {
        const csv = await this.svc.getDateRangeReportCsv(user, from, to, { departmentId, employeeId, status });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${from}_to_${to}.csv"`);
        res.send(csv);
    }
    getReport(user, date) { return this.svc.getReport(user, date); }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Clock in' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)('check-out'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Clock out' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "checkOut", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:view_all', 'attendance:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Today\'s attendance report' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getToday", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:view'),
    (0, swagger_1.ApiOperation)({ summary: 'My attendance history' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyAttendance", null);
__decorate([
    (0, common_1.Get)('report/range'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Attendance report for a date range with filters' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('departmentId')),
    __param(4, (0, common_1.Query)('employeeId')),
    __param(5, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getDateRangeReport", null);
__decorate([
    (0, common_1.Get)('report/range/csv'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export date-range attendance report as CSV' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('departmentId')),
    __param(4, (0, common_1.Query)('employeeId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getDateRangeReportCsv", null);
__decorate([
    (0, common_1.Get)('report'),
    (0, permissions_decorator_1.RequirePermissions)('attendance:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Attendance report for a date' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getReport", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map
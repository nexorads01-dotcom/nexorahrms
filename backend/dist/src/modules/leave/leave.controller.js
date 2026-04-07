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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leave_service_1 = require("./leave.service");
const decorators_1 = require("../../common/decorators");
const permissions_decorator_1 = require("../roles/permissions.decorator");
let LeaveController = class LeaveController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    getTypes(tenantId) { return this.svc.getLeaveTypes(tenantId); }
    createType(tenantId, body) {
        return this.svc.createLeaveType(tenantId, body);
    }
    apply(tenantId, employeeId, body) {
        return this.svc.applyLeave(tenantId, employeeId, body);
    }
    getRequests(user, status, employeeId) {
        return this.svc.getRequests(user, { status, employeeId });
    }
    getPending(user) { return this.svc.getRequests(user, { status: 'pending' }); }
    approve(user, userId, id, body) {
        return this.svc.approveLeave(user, id, userId, body?.comment);
    }
    reject(user, userId, id, body) {
        return this.svc.rejectLeave(user, id, userId, body?.comment);
    }
    cancel(tenantId, employeeId, id) {
        return this.svc.cancelLeave(tenantId, id, employeeId);
    }
    getBalance(user, employeeId) {
        return this.svc.getBalance(user.tenantId, employeeId, user);
    }
    getHolidays(tenantId, year) {
        return this.svc.getHolidays(tenantId, year ? parseInt(year) : undefined);
    }
    addHoliday(tenantId, body) {
        return this.svc.createHoliday(tenantId, body);
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Get)('types'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List leave types' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getTypes", null);
__decorate([
    (0, common_1.Post)('types'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:edit_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Create leave type' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "createType", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply for leave' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List leave requests' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Get)('requests/pending'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Pending approvals' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getPending", null);
__decorate([
    (0, common_1.Put)('requests/:id/approve'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve leave' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)('requests/:id/reject'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject leave' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)('requests/:id'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel own leave request' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('balance/:employeeId'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leave balance' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('holidays'),
    (0, permissions_decorator_1.RequirePermissions)('leaves:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List holidays' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "getHolidays", null);
__decorate([
    (0, common_1.Post)('holidays'),
    (0, permissions_decorator_1.RequirePermissions)('settings:edit_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Add holiday' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveController.prototype, "addHoliday", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('Leave'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/leave'),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map
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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const decorators_1 = require("../../common/decorators");
const permissions_decorator_1 = require("../roles/permissions.decorator");
let PayrollController = class PayrollController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    getStructures(tenantId) { return this.svc.getStructures(tenantId); }
    createStructure(tenantId, body) {
        return this.svc.createStructure(tenantId, body);
    }
    getRuns(tenantId) { return this.svc.getRuns(tenantId); }
    createRun(tenantId, userId, body) {
        return this.svc.createRun(tenantId, body.month, body.year, userId);
    }
    getRunDetail(tenantId, id) { return this.svc.getRunDetail(tenantId, id); }
    getPayslip(tenantId, id) { return this.svc.getPayslip(tenantId, id); }
    getMyPayslips(tenantId, employeeId) {
        return this.svc.getEmployeePayslips(tenantId, employeeId);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('structures'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'List salary structures' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getStructures", null);
__decorate([
    (0, common_1.Post)('structures'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:edit_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Create salary structure' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createStructure", null);
__decorate([
    (0, common_1.Get)('runs'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'List payroll runs' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getRuns", null);
__decorate([
    (0, common_1.Post)('run'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Run payroll for a month' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "createRun", null);
__decorate([
    (0, common_1.Get)('runs/:id'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Payroll run detail with payslips' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getRunDetail", null);
__decorate([
    (0, common_1.Get)('payslips/:id'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payslip detail' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getPayslip", null);
__decorate([
    (0, common_1.Get)('my-payslips'),
    (0, permissions_decorator_1.RequirePermissions)('payroll:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my payslips' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "getMyPayslips", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Payroll'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map
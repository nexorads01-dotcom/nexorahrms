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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const employee_dto_1 = require("./dto/employee.dto");
const decorators_1 = require("../../common/decorators");
const permissions_decorator_1 = require("../roles/permissions.decorator");
let EmployeesController = class EmployeesController {
    employeesService;
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    getAllowedRoles() {
        return { roles: [...employee_dto_1.USER_ROLES] };
    }
    findAll(user, query) {
        return this.employeesService.findAll(user, query);
    }
    getStats(tenantId) {
        return this.employeesService.getStats(tenantId);
    }
    findOne(user, id) {
        return this.employeesService.findOne(user, id);
    }
    create(tenantId, dto) {
        return this.employeesService.create(tenantId, dto);
    }
    update(user, id, dto) {
        return this.employeesService.update(user, id, dto);
    }
    remove(tenantId, id) {
        return this.employeesService.remove(tenantId, id);
    }
    updateEmployeeUserRole(tenantId, id, dto) {
        return this.employeesService.updateEmployeeUserRole(tenantId, id, dto);
    }
    deactivateEmployeeUserRole(tenantId, id) {
        return this.employeesService.deactivateEmployeeUser(tenantId, id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, permissions_decorator_1.RequirePermissions)('roles:view_all'),
    (0, swagger_1.ApiOperation)({ summary: 'List allowed user roles inside the current company (tenant)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getAllowedRoles", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('employees:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List all employees (paginated)' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, employee_dto_1.EmployeeQueryDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.RequirePermissions)('employees:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee statistics' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('employees:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee by ID' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('employees:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new employee' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('employees:edit_all'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('employees:delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate employee (soft delete)' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/user-role'),
    (0, permissions_decorator_1.RequirePermissions)('roles:edit'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign/Update a user role for an employee account' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, employee_dto_1.UpdateEmployeeUserRoleDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateEmployeeUserRole", null);
__decorate([
    (0, common_1.Delete)(':id/user-role'),
    (0, permissions_decorator_1.RequirePermissions)('roles:edit'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove access by deactivating an employee user account' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "deactivateEmployeeUserRole", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map
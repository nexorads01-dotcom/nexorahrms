"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, query) {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, departmentId, status, employmentType } = query;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (departmentId)
            where.departmentId = departmentId;
        if (status)
            where.status = status;
        if (employmentType)
            where.employmentType = employmentType;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { employeeCode: { contains: search } },
            ];
        }
        const [employees, total] = await Promise.all([
            this.prisma.employee.findMany({
                where: where,
                skip,
                take: limit,
                orderBy: { [sort]: order },
                include: {
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } },
                    reportingManager: { select: { id: true, firstName: true, lastName: true } },
                    user: { select: { role: true, isActive: true } },
                },
            }),
            this.prisma.employee.count({ where: where }),
        ]);
        return {
            ...{ items: employees },
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(tenantId, id) {
        const employee = await this.prisma.employee.findFirst({
            where: { id, tenantId },
            include: {
                department: true,
                designation: true,
                reportingManager: { select: { id: true, firstName: true, lastName: true, email: true } },
                shift: true,
                salaryStructure: true,
                user: { select: { role: true, isActive: true } },
            },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        return employee;
    }
    async updateEmployeeUserRole(tenantId, employeeId, dto) {
        const defaultPassword = 'NewPassword123!';
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: { user: true },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        if (!employee.user) {
            const passwordHash = await bcrypt.hash(defaultPassword, 12);
            const user = await this.prisma.user.create({
                data: {
                    tenantId,
                    email: employee.email,
                    passwordHash,
                    role: dto.role,
                    isActive: dto.isActive ?? true,
                    isVerified: dto.isVerified ?? true,
                },
            });
            await this.prisma.employee.update({
                where: { id: employee.id },
                data: { userId: user.id },
            });
            return { message: 'User account created and role assigned', userId: user.id };
        }
        const updateData = {
            role: dto.role,
            isActive: dto.isActive ?? true,
        };
        if (dto.isVerified !== undefined)
            updateData.isVerified = dto.isVerified;
        if (dto.resetPassword) {
            updateData.passwordHash = await bcrypt.hash(defaultPassword, 12);
        }
        if (employee.user.tenantId !== tenantId) {
            throw new common_1.BadRequestException('User does not belong to the current tenant');
        }
        const updated = await this.prisma.user.update({
            where: { id: employee.user.id },
            data: updateData,
            select: { id: true, email: true, role: true, isActive: true },
        });
        return { message: 'User role updated', user: updated };
    }
    async deactivateEmployeeUser(tenantId, employeeId) {
        const employee = await this.prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: { user: true },
        });
        if (!employee)
            throw new common_1.NotFoundException('Employee not found');
        if (!employee.user)
            throw new common_1.NotFoundException('Employee user account not found');
        if (employee.user.tenantId !== tenantId) {
            throw new common_1.BadRequestException('User does not belong to the current tenant');
        }
        const updated = await this.prisma.user.update({
            where: { id: employee.user.id },
            data: { isActive: false },
            select: { id: true, email: true, role: true, isActive: true },
        });
        return { message: 'User deactivated', user: updated };
    }
    async create(tenantId, dto) {
        const existing = await this.prisma.employee.findFirst({ where: { tenantId, email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Employee with this email already exists');
        const lastEmployee = await this.prisma.employee.findFirst({
            where: { tenantId },
            orderBy: { employeeCode: 'desc' },
        });
        let nextCode = 1;
        if (lastEmployee) {
            const num = parseInt(lastEmployee.employeeCode.replace('NEX-', ''), 10);
            nextCode = (isNaN(num) ? 0 : num) + 1;
        }
        const employeeCode = `NEX-${nextCode.toString().padStart(4, '0')}`;
        const defaultPassword = 'NewPassword123!';
        const passwordHash = await bcrypt.hash(defaultPassword, 12);
        return this.prisma.employee.create({
            data: {
                tenant: { connect: { id: tenantId } },
                employeeCode,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                gender: dto.gender,
                address: dto.address,
                city: dto.city,
                state: dto.state,
                country: dto.country,
                zipCode: dto.zipCode,
                department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
                designation: dto.designationId ? { connect: { id: dto.designationId } } : undefined,
                reportingManager: dto.reportingManagerId ? { connect: { id: dto.reportingManagerId } } : undefined,
                salaryStructure: dto.salaryStructureId ? { connect: { id: dto.salaryStructureId } } : undefined,
                shift: dto.shiftId ? { connect: { id: dto.shiftId } } : undefined,
                dateOfJoining: new Date(dto.dateOfJoining),
                employmentType: dto.employmentType || 'full_time',
                status: dto.status || 'active',
                user: {
                    create: {
                        tenant: { connect: { id: tenantId } },
                        email: dto.email,
                        passwordHash,
                        role: 'employee',
                        isActive: true,
                        isVerified: true,
                    },
                },
            },
            include: { department: { select: { name: true } }, designation: { select: { name: true } } },
        });
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        return this.prisma.employee.update({
            where: { id },
            data: dto,
            include: { department: { select: { name: true } }, designation: { select: { name: true } } },
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.employee.update({ where: { id }, data: { status: 'terminated', dateOfLeaving: new Date() } });
    }
    async getStats(tenantId) {
        const [total, active, onLeave, departments] = await Promise.all([
            this.prisma.employee.count({ where: { tenantId } }),
            this.prisma.employee.count({ where: { tenantId, status: 'active' } }),
            this.prisma.employee.count({ where: { tenantId, status: 'on_leave' } }),
            this.prisma.department.count({ where: { tenantId } }),
        ]);
        return { total, active, onLeave, departments };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map
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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        const depts = await this.prisma.department.findMany({
            where: { tenantId },
            include: { head: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
            orderBy: { name: 'asc' },
        });
        return depts.map((d) => ({ ...d, employeeCount: d._count.employees }));
    }
    async findOne(tenantId, id) {
        const dept = await this.prisma.department.findFirst({
            where: { id, tenantId },
            include: { head: { select: { id: true, firstName: true, lastName: true } }, employees: { select: { id: true, firstName: true, lastName: true, employeeCode: true, status: true } } },
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return dept;
    }
    async create(tenantId, data) {
        const existing = await this.prisma.department.findFirst({ where: { tenantId, name: data.name } });
        if (existing)
            throw new common_1.ConflictException('Department with this name already exists');
        return this.prisma.department.create({ data: { tenantId, ...data } });
    }
    async update(tenantId, id, data) {
        await this.findOne(tenantId, id);
        return this.prisma.department.update({ where: { id }, data });
    }
    async remove(tenantId, id) {
        const dept = await this.findOne(tenantId, id);
        if (dept.employees?.length > 0)
            throw new common_1.ConflictException('Cannot delete department with employees');
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map
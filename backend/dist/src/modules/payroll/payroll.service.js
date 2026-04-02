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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PayrollService = class PayrollService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStructures(tenantId) {
        return this.prisma.salaryStructure.findMany({ where: { tenantId }, include: { _count: { select: { employees: true } } } });
    }
    async createStructure(tenantId, data) {
        return this.prisma.salaryStructure.create({
            data: { tenantId, name: data.name, baseSalary: data.baseSalary, allowances: data.allowances || '[]', deductions: data.deductions || '[]' },
        });
    }
    async getRuns(tenantId) {
        return this.prisma.payrollRun.findMany({ where: { tenantId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    }
    async createRun(tenantId, month, year, processedBy) {
        const existing = await this.prisma.payrollRun.findFirst({ where: { tenantId, month, year } });
        if (existing)
            throw new common_1.BadRequestException(`Payroll for ${month}/${year} already exists`);
        const employees = await this.prisma.employee.findMany({
            where: { tenantId, status: 'active', salaryStructureId: { not: null } },
            include: { salaryStructure: true },
        });
        const run = await this.prisma.payrollRun.create({
            data: { tenantId, month, year, status: 'processing', totalEmployees: employees.length, processedBy },
        });
        let totalGross = 0, totalDeductions = 0, totalNet = 0;
        for (const emp of employees) {
            if (!emp.salaryStructure)
                continue;
            const structure = emp.salaryStructure;
            const allowances = JSON.parse(structure.allowances || '[]');
            const deductions = JSON.parse(structure.deductions || '[]');
            const allowanceTotal = allowances.reduce((s, a) => s + (a.value || 0), 0);
            const deductionTotal = deductions.reduce((s, d) => s + (d.value || 0), 0);
            const gross = structure.baseSalary + allowanceTotal;
            const tax = gross * 0.1;
            const net = gross - deductionTotal - tax;
            await this.prisma.payslip.create({
                data: {
                    tenantId, employeeId: emp.id, payrollRunId: run.id,
                    grossSalary: gross, earnings: JSON.stringify([{ name: 'Basic', amount: structure.baseSalary }, ...allowances]),
                    deductionsDetail: JSON.stringify([...deductions, { name: 'Tax', amount: tax }]),
                    totalDeductions: deductionTotal + tax, tax, netSalary: net,
                    workingDays: 22, daysWorked: 22, lopDays: 0,
                },
            });
            totalGross += gross;
            totalDeductions += deductionTotal + tax;
            totalNet += net;
        }
        return this.prisma.payrollRun.update({
            where: { id: run.id },
            data: { status: 'completed', totalGross, totalDeductions, totalNet, processedAt: new Date() },
        });
    }
    async getRunDetail(tenantId, runId) {
        const run = await this.prisma.payrollRun.findFirst({
            where: { id: runId, tenantId },
            include: { payslips: { include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } } } },
        });
        if (!run)
            throw new common_1.NotFoundException('Payroll run not found');
        return run;
    }
    async getPayslip(tenantId, payslipId) {
        const payslip = await this.prisma.payslip.findFirst({
            where: { id: payslipId, tenantId },
            include: { employee: { include: { department: { select: { name: true } }, designation: { select: { name: true } } } }, payrollRun: true },
        });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        return payslip;
    }
    async getEmployeePayslips(tenantId, employeeId) {
        return this.prisma.payslip.findMany({
            where: { tenantId, employeeId },
            include: { payrollRun: { select: { month: true, year: true, status: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map
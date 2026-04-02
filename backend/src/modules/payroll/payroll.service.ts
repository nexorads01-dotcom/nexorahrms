import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ===== SALARY STRUCTURES =====
  async getStructures(tenantId: string) {
    return this.prisma.salaryStructure.findMany({ where: { tenantId }, include: { _count: { select: { employees: true } } } });
  }

  async createStructure(tenantId: string, data: { name: string; baseSalary: number; allowances?: string; deductions?: string }) {
    return this.prisma.salaryStructure.create({
      data: { tenantId, name: data.name, baseSalary: data.baseSalary, allowances: data.allowances || '[]', deductions: data.deductions || '[]' },
    });
  }

  // ===== PAYROLL RUNS =====
  async getRuns(tenantId: string) {
    return this.prisma.payrollRun.findMany({ where: { tenantId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
  }

  async createRun(tenantId: string, month: number, year: number, processedBy: string) {
    const existing = await this.prisma.payrollRun.findFirst({ where: { tenantId, month, year } });
    if (existing) throw new BadRequestException(`Payroll for ${month}/${year} already exists`);

    // Get all active employees with salary structures
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active', salaryStructureId: { not: null } },
      include: { salaryStructure: true },
    });

    const run = await this.prisma.payrollRun.create({
      data: { tenantId, month, year, status: 'processing', totalEmployees: employees.length, processedBy },
    });

    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    for (const emp of employees) {
      if (!emp.salaryStructure) continue;
      const structure = emp.salaryStructure;
      const allowances = JSON.parse(structure.allowances || '[]');
      const deductions = JSON.parse(structure.deductions || '[]');

      const allowanceTotal = allowances.reduce((s: number, a: { value: number }) => s + (a.value || 0), 0);
      const deductionTotal = deductions.reduce((s: number, d: { value: number }) => s + (d.value || 0), 0);
      const gross = structure.baseSalary + allowanceTotal;
      const tax = gross * 0.1; // simplified 10% tax
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
      totalGross += gross; totalDeductions += deductionTotal + tax; totalNet += net;
    }

    return this.prisma.payrollRun.update({
      where: { id: run.id },
      data: { status: 'completed', totalGross, totalDeductions, totalNet, processedAt: new Date() },
    });
  }

  async getRunDetail(tenantId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, tenantId },
      include: { payslips: { include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } } } },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async getPayslip(tenantId: string, payslipId: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, tenantId },
      include: { employee: { include: { department: { select: { name: true } }, designation: { select: { name: true } } } }, payrollRun: true },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }

  async getEmployeePayslips(tenantId: string, employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { tenantId, employeeId },
      include: { payrollRun: { select: { month: true, year: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

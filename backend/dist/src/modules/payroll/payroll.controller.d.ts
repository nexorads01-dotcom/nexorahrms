import { PayrollService } from './payroll.service';
export declare class PayrollController {
    private svc;
    constructor(svc: PayrollService);
    getStructures(tenantId: string): Promise<({
        _count: {
            employees: number;
        };
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        baseSalary: number;
        allowances: string;
        deductions: string;
    })[]>;
    createStructure(tenantId: string, body: {
        name: string;
        baseSalary: number;
        allowances?: string;
        deductions?: string;
    }): Promise<{
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        baseSalary: number;
        allowances: string;
        deductions: string;
    }>;
    getRuns(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        notes: string | null;
        year: number;
        month: number;
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
        processedBy: string | null;
        processedAt: Date | null;
    }[]>;
    createRun(tenantId: string, userId: string, body: {
        month: number;
        year: number;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        notes: string | null;
        year: number;
        month: number;
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    getRunDetail(tenantId: string, id: string): Promise<{
        payslips: ({
            employee: {
                employeeCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            employeeId: string;
            totalDeductions: number;
            grossSalary: number;
            earnings: string;
            deductionsDetail: string;
            tax: number;
            netSalary: number;
            workingDays: number;
            daysWorked: number;
            lopDays: number;
            pdfUrl: string | null;
            payrollRunId: string;
        })[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        notes: string | null;
        year: number;
        month: number;
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
        processedBy: string | null;
        processedAt: Date | null;
    }>;
    getPayslip(user: any, id: string): Promise<{
        employee: {
            department: {
                name: string;
            } | null;
            designation: {
                name: string;
            } | null;
        } & {
            email: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            country: string | null;
            status: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            dateOfJoining: Date;
            dateOfLeaving: Date | null;
            employmentType: string;
            profilePhotoUrl: string | null;
            emergencyContact: string;
            bankDetails: string;
            customFields: string;
            departmentId: string | null;
            designationId: string | null;
            reportingManagerId: string | null;
            salaryStructureId: string | null;
            shiftId: string | null;
        };
        payrollRun: {
            id: string;
            tenantId: string;
            createdAt: Date;
            status: string;
            notes: string | null;
            year: number;
            month: number;
            totalEmployees: number;
            totalGross: number;
            totalDeductions: number;
            totalNet: number;
            processedBy: string | null;
            processedAt: Date | null;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        employeeId: string;
        totalDeductions: number;
        grossSalary: number;
        earnings: string;
        deductionsDetail: string;
        tax: number;
        netSalary: number;
        workingDays: number;
        daysWorked: number;
        lopDays: number;
        pdfUrl: string | null;
        payrollRunId: string;
    }>;
    getMyPayslips(tenantId: string, employeeId: string): Promise<({
        payrollRun: {
            status: string;
            year: number;
            month: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        employeeId: string;
        totalDeductions: number;
        grossSalary: number;
        earnings: string;
        deductionsDetail: string;
        tax: number;
        netSalary: number;
        workingDays: number;
        daysWorked: number;
        lopDays: number;
        pdfUrl: string | null;
        payrollRunId: string;
    })[]>;
}

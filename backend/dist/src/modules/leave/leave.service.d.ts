import { PrismaService } from '../../prisma/prisma.service';
export declare class LeaveService {
    private prisma;
    constructor(prisma: PrismaService);
    getLeaveTypes(tenantId: string): Promise<({
        policies: {
            id: string;
            tenantId: string;
            createdAt: Date;
            annualQuota: number;
            maxCarryForward: number;
            allowNegative: boolean;
            accrualType: string;
            leaveTypeId: string;
        }[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        isPaid: boolean;
        color: string;
    })[]>;
    createLeaveType(tenantId: string, data: {
        name: string;
        code: string;
        color?: string;
        isPaid?: boolean;
        annualQuota: number;
    }): Promise<{
        name: string;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        isPaid: boolean;
        color: string;
    }>;
    applyLeave(tenantId: string, employeeId: string, data: {
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        reason?: string;
        isHalfDay?: boolean;
    }): Promise<{
        leaveType: {
            name: string;
            code: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        leaveTypeId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        days: number;
        isHalfDay: boolean;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
    }>;
    getRequests(user: any, filters?: {
        status?: string;
        employeeId?: string;
    }): Promise<({
        employee: {
            department: {
                name: string;
            } | null;
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        leaveType: {
            name: string;
            code: string;
            color: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        leaveTypeId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        days: number;
        isHalfDay: boolean;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
    })[]>;
    approveLeave(tenantId: string, requestId: string, reviewedBy: string, comment?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        leaveTypeId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        days: number;
        isHalfDay: boolean;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
    }>;
    rejectLeave(tenantId: string, requestId: string, reviewedBy: string, comment?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        leaveTypeId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        days: number;
        isHalfDay: boolean;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
    }>;
    cancelLeave(tenantId: string, requestId: string, employeeId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        leaveTypeId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date;
        days: number;
        isHalfDay: boolean;
        reason: string | null;
        reviewedBy: string | null;
        reviewedAt: Date | null;
        reviewComment: string | null;
    }>;
    getBalance(tenantId: string, employeeId: string): Promise<{
        leaveTypeId: string;
        leaveType: string;
        code: string;
        color: string;
        total: number;
        used: number;
        pending: number;
        remaining: number;
        allowNegative: boolean;
    }[]>;
    getHolidays(tenantId: string, year?: number): Promise<{
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        date: Date;
        isOptional: boolean;
    }[]>;
    createHoliday(tenantId: string, data: {
        name: string;
        date: string;
        isOptional?: boolean;
        description?: string;
    }): Promise<{
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        createdAt: Date;
        date: Date;
        isOptional: boolean;
    }>;
}

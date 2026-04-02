import { LeaveService } from './leave.service';
export declare class LeaveController {
    private svc;
    constructor(svc: LeaveService);
    getTypes(tenantId: string): Promise<({
        policies: {
            id: string;
            createdAt: Date;
            tenantId: string;
            annualQuota: number;
            maxCarryForward: number;
            allowNegative: boolean;
            accrualType: string;
            leaveTypeId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string;
        isPaid: boolean;
        color: string;
    })[]>;
    createType(tenantId: string, body: {
        name: string;
        code: string;
        color?: string;
        isPaid?: boolean;
        annualQuota: number;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string;
        isPaid: boolean;
        color: string;
    }>;
    apply(tenantId: string, employeeId: string, body: {
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
        status: string;
        createdAt: Date;
        tenantId: string;
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
    getRequests(tenantId: string, status?: string, employeeId?: string): Promise<({
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
        status: string;
        createdAt: Date;
        tenantId: string;
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
    getPending(tenantId: string): Promise<({
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
        status: string;
        createdAt: Date;
        tenantId: string;
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
    approve(tenantId: string, userId: string, id: string, body: {
        comment?: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
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
    reject(tenantId: string, userId: string, id: string, body: {
        comment?: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
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
    cancel(tenantId: string, employeeId: string, id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
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
    getHolidays(tenantId: string, year?: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        tenantId: string;
        date: Date;
        isOptional: boolean;
    }[]>;
    addHoliday(tenantId: string, body: {
        name: string;
        date: string;
        isOptional?: boolean;
        description?: string;
    }): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        tenantId: string;
        date: Date;
        isOptional: boolean;
    }>;
}

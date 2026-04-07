import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private svc;
    constructor(svc: AttendanceService);
    checkIn(tenantId: string, employeeId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    checkOut(tenantId: string, employeeId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    getToday(user: any): Promise<{
        records: any[];
        stats: {
            totalEmployees: number;
            present: number;
            late: number;
            absent: number;
            onLeave: number;
        };
    }>;
    getMyAttendance(tenantId: string, employeeId: string, from?: string, to?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }[]>;
    getReport(user: any, date: string): Promise<({
        employee: {
            department: {
                name: string;
            } | null;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        status: string;
        ipAddress: string | null;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    })[]>;
}

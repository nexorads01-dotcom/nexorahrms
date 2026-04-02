import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private svc;
    constructor(svc: AttendanceService);
    checkIn(tenantId: string, employeeId: string, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    checkOut(tenantId: string, employeeId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }>;
    getToday(tenantId: string): Promise<{
        records: ({
            employee: {
                department: {
                    name: string;
                } | null;
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            tenantId: string;
            employeeId: string;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            hoursWorked: number | null;
            source: string;
            ipAddress: string | null;
            notes: string | null;
            isRegularized: boolean;
            regularizationReason: string | null;
        })[];
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
        status: string;
        createdAt: Date;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    }[]>;
    getReport(tenantId: string, date: string): Promise<({
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
        status: string;
        createdAt: Date;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
    })[]>;
}

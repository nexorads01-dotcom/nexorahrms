import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private svc;
    constructor(svc: AttendanceService);
    checkIn(tenantId: string, employeeId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        status: string;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
        createdAt: Date;
    }>;
    checkOut(tenantId: string, employeeId: string): Promise<{
        id: string;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        status: string;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
        createdAt: Date;
    }>;
    getToday(tenantId: string): Promise<{
        records: ({
            employee: {
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
                department: {
                    name: string;
                } | null;
            };
        } & {
            id: string;
            tenantId: string;
            employeeId: string;
            date: Date;
            checkIn: Date | null;
            checkOut: Date | null;
            hoursWorked: number | null;
            status: string;
            source: string;
            ipAddress: string | null;
            notes: string | null;
            isRegularized: boolean;
            regularizationReason: string | null;
            createdAt: Date;
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
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        status: string;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
        createdAt: Date;
    }[]>;
    getReport(tenantId: string, date: string): Promise<({
        employee: {
            employeeCode: string;
            firstName: string;
            lastName: string;
            department: {
                name: string;
            } | null;
        };
    } & {
        id: string;
        tenantId: string;
        employeeId: string;
        date: Date;
        checkIn: Date | null;
        checkOut: Date | null;
        hoursWorked: number | null;
        status: string;
        source: string;
        ipAddress: string | null;
        notes: string | null;
        isRegularized: boolean;
        regularizationReason: string | null;
        createdAt: Date;
    })[]>;
}

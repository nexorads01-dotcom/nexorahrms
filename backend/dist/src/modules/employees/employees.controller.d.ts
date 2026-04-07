import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, EmployeeQueryDto, UpdateEmployeeDto, UpdateEmployeeUserRoleDto } from './dto/employee.dto';
export declare class EmployeesController {
    private employeesService;
    constructor(employeesService: EmployeesService);
    getAllowedRoles(): {
        roles: ("employee" | "super_admin" | "company_admin" | "hr_manager" | "manager")[];
    };
    findAll(user: any, query: EmployeeQueryDto): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        items: ({
            user: {
                role: string;
                isActive: boolean;
            } | null;
            department: {
                name: string;
                id: string;
            } | null;
            designation: {
                name: string;
                id: string;
            } | null;
            reportingManager: {
                id: string;
                firstName: string;
                lastName: string;
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
        })[];
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        active: number;
        onLeave: number;
        departments: number;
    }>;
    findOne(tenantId: string, id: string): Promise<{
        user: {
            role: string;
            isActive: boolean;
        } | null;
        department: {
            name: string;
            description: string | null;
            id: string;
            tenantId: string;
            isActive: boolean;
            createdAt: Date;
            code: string | null;
            headId: string | null;
            parentId: string | null;
        } | null;
        designation: {
            name: string;
            id: string;
            tenantId: string;
            isActive: boolean;
            createdAt: Date;
            level: number;
        } | null;
        shift: {
            name: string;
            id: string;
            tenantId: string;
            isActive: boolean;
            createdAt: Date;
            startTime: string;
            endTime: string;
            graceMinutes: number;
            isDefault: boolean;
        } | null;
        salaryStructure: {
            name: string;
            id: string;
            tenantId: string;
            isActive: boolean;
            createdAt: Date;
            baseSalary: number;
            allowances: string;
            deductions: string;
        } | null;
        reportingManager: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
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
    }>;
    create(tenantId: string, dto: CreateEmployeeDto): Promise<{
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
    }>;
    update(tenantId: string, id: string, dto: UpdateEmployeeDto): Promise<{
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
    }>;
    remove(tenantId: string, id: string): Promise<{
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
    }>;
    updateEmployeeUserRole(tenantId: string, id: string, dto: UpdateEmployeeUserRoleDto): Promise<{
        message: string;
        userId: string;
        user?: undefined;
    } | {
        message: string;
        user: {
            role: string;
            email: string;
            id: string;
            isActive: boolean;
        };
        userId?: undefined;
    }>;
    deactivateEmployeeUserRole(tenantId: string, id: string): Promise<{
        message: string;
        user: {
            role: string;
            email: string;
            id: string;
            isActive: boolean;
        };
    }>;
}

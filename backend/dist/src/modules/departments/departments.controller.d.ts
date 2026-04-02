import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private svc;
    constructor(svc: DepartmentsService);
    findAll(tenantId: string): Promise<{
        employeeCount: number;
        _count: {
            employees: number;
        };
        head: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string | null;
        headId: string | null;
        parentId: string | null;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        employees: {
            id: string;
            status: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        }[];
        head: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string | null;
        headId: string | null;
        parentId: string | null;
    }>;
    create(tenantId: string, body: {
        name: string;
        code?: string;
        description?: string;
        headId?: string;
    }): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string | null;
        headId: string | null;
        parentId: string | null;
    }>;
    update(tenantId: string, id: string, body: {
        name?: string;
        description?: string;
        headId?: string;
    }): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string | null;
        headId: string | null;
        parentId: string | null;
    }>;
    remove(tenantId: string, id: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        isActive: boolean;
        tenantId: string;
        code: string | null;
        headId: string | null;
        parentId: string | null;
    }>;
}

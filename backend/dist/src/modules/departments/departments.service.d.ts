import { PrismaService } from '../../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    create(tenantId: string, data: {
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
    update(tenantId: string, id: string, data: {
        name?: string;
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

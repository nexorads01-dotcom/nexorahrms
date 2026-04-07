import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(req: any): Promise<({
        _count: {
            userRoles: number;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        isSystem: boolean;
        level: number;
    })[]>;
    findOne(req: any, id: string): Promise<{
        rolePermissions: ({
            permission: {
                description: string | null;
                id: string;
                createdAt: Date;
                slug: string;
                module: string;
                action: string;
                category: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
            dataScope: string;
        })[];
    } & {
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        isSystem: boolean;
        level: number;
    }>;
    create(req: any, createRoleDto: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        isSystem: boolean;
        level: number;
    }>;
    update(req: any, id: string, updateRoleDto: any): Promise<{
        rolePermissions: ({
            permission: {
                description: string | null;
                id: string;
                createdAt: Date;
                slug: string;
                module: string;
                action: string;
                category: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
            dataScope: string;
        })[];
    } & {
        name: string;
        description: string | null;
        id: string;
        tenantId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        isSystem: boolean;
        level: number;
    }>;
    delete(req: any, id: string): Promise<void>;
}

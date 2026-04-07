import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from './permissions.service';
export interface CreateRoleDto {
    name: string;
    description?: string;
    permissions: {
        slug: string;
        dataScope?: string;
    }[];
}
export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissions?: {
        slug: string;
        dataScope?: string;
    }[];
    isActive?: boolean;
}
export declare class RolesService {
    private readonly prisma;
    private readonly permissionsService;
    constructor(prisma: PrismaService, permissionsService: PermissionsService);
    findAll(tenantId: string): Promise<({
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
    findOne(tenantId: string, roleId: string): Promise<{
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
    create(tenantId: string, actorId: string, data: CreateRoleDto): Promise<{
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
    update(tenantId: string, actorId: string, roleId: string, data: UpdateRoleDto): Promise<{
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
    delete(tenantId: string, actorId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<({
        role: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        roleId: string;
    })[]>;
    assignRole(actorId: string, tenantId: string, userId: string, roleId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        roleId: string;
    }>;
    removeRole(actorId: string, tenantId: string, userId: string, roleId: string): Promise<void>;
}

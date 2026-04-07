"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_service_1 = require("./permissions.service");
let RolesService = class RolesService {
    prisma;
    permissionsService;
    constructor(prisma, permissionsService) {
        this.prisma = prisma;
        this.permissionsService = permissionsService;
    }
    async findAll(tenantId) {
        const roles = await this.prisma.role.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { userRoles: true }
                }
            },
            orderBy: [
                { isSystem: 'desc' },
                { name: 'asc' }
            ]
        });
        return roles;
    }
    async findOne(tenantId, roleId) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, tenantId },
            include: {
                rolePermissions: {
                    include: { permission: true }
                }
            }
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async create(tenantId, actorId, data) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const existing = await this.prisma.role.findUnique({
            where: { tenantId_slug: { tenantId, slug } }
        });
        if (existing) {
            throw new common_1.BadRequestException('A role with a similar name already exists');
        }
        const permissionLookups = await this.prisma.permission.findMany({
            where: { slug: { in: data.permissions.map(p => p.slug) } }
        });
        const rpData = data.permissions.map(p => {
            const permItem = permissionLookups.find(lookup => lookup.slug === p.slug);
            if (!permItem)
                throw new common_1.BadRequestException(`Invalid permission slug: ${p.slug}`);
            return {
                permissionId: permItem.id,
                dataScope: p.dataScope || 'self',
            };
        });
        const result = await this.prisma.role.create({
            data: {
                tenantId,
                name: data.name,
                slug,
                description: data.description,
                isSystem: false,
                isActive: true,
                rolePermissions: {
                    create: rpData
                }
            }
        });
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorId,
                action: 'CREATE',
                entityType: 'Role',
                entityId: result.id,
                newValues: JSON.stringify(data),
            }
        });
        return result;
    }
    async update(tenantId, actorId, roleId, data) {
        const role = await this.findOne(tenantId, roleId);
        if (role.isSystem) {
            if (data.name && data.name !== role.name) {
                throw new common_1.ForbiddenException('Cannot change the name of a system role');
            }
            if (data.permissions) {
                throw new common_1.ForbiddenException('Cannot modify permissions of a system role directly (assign additional custom roles instead)');
            }
            if (data.isActive !== undefined && data.isActive === false) {
                throw new common_1.ForbiddenException('Cannot deactivate a system role');
            }
        }
        const txs = [];
        txs.push(this.prisma.role.update({
            where: { id: roleId },
            data: {
                name: data.name,
                description: data.description,
                isActive: data.isActive
            }
        }));
        if (data.permissions && !role.isSystem) {
            txs.push(this.prisma.rolePermission.deleteMany({
                where: { roleId }
            }));
            const permissionLookups = await this.prisma.permission.findMany({
                where: { slug: { in: data.permissions.map(p => p.slug) } }
            });
            const createManyData = data.permissions.map(p => {
                const permItem = permissionLookups.find(lookup => lookup.slug === p.slug);
                return {
                    roleId,
                    permissionId: permItem.id,
                    dataScope: p.dataScope || 'self'
                };
            });
            if (createManyData.length > 0) {
                txs.push(this.prisma.rolePermission.createMany({
                    data: createManyData
                }));
            }
        }
        await this.prisma.$transaction(txs);
        const usersWithRole = await this.prisma.userRole.findMany({ where: { roleId } });
        for (const ur of usersWithRole) {
            this.permissionsService.invalidateCache(ur.userId);
        }
        const updatedRole = await this.findOne(tenantId, roleId);
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorId,
                action: 'UPDATE',
                entityType: 'Role',
                entityId: roleId,
                oldValues: JSON.stringify(role),
                newValues: JSON.stringify(data),
            }
        });
        return updatedRole;
    }
    async delete(tenantId, actorId, roleId) {
        const role = await this.findOne(tenantId, roleId);
        if (role.isSystem) {
            throw new common_1.ForbiddenException('Cannot delete a system role');
        }
        const assignedCount = await this.prisma.userRole.count({ where: { roleId } });
        if (assignedCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete role because it is still assigned to ${assignedCount} users`);
        }
        await this.prisma.role.delete({ where: { id: roleId } });
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorId,
                action: 'DELETE',
                entityType: 'Role',
                entityId: roleId,
                oldValues: JSON.stringify(role),
            }
        });
    }
    async getUserRoles(userId) {
        return this.prisma.userRole.findMany({
            where: { userId },
            include: { role: true }
        });
    }
    async assignRole(actorId, tenantId, userId, roleId) {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const result = await this.prisma.userRole.upsert({
            where: { userId_roleId: { userId, roleId } },
            create: { userId, roleId },
            update: {}
        });
        this.permissionsService.invalidateCache(userId);
        this.permissionsService.invalidateCache(userId);
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorId,
                action: 'CREATE',
                entityType: 'UserRole',
                entityId: `${userId}_${roleId}`,
            }
        });
        return result;
    }
    async removeRole(actorId, tenantId, userId, roleId) {
        await this.prisma.userRole.deleteMany({
            where: { userId, roleId }
        });
        this.permissionsService.invalidateCache(userId);
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId: actorId,
                action: 'DELETE',
                entityType: 'UserRole',
                entityId: `${userId}_${roleId}`,
            }
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        permissions_service_1.PermissionsService])
], RolesService);
//# sourceMappingURL=roles.service.js.map
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
var PermissionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_constants_1 = require("./constants/permissions.constants");
let PermissionsService = PermissionsService_1 = class PermissionsService {
    prisma;
    logger = new common_1.Logger(PermissionsService_1.name);
    CACHE_TTL_MS = 5 * 60 * 1000;
    SWR_TTL_MS = 15 * 60 * 1000;
    permissionCache = new Map();
    refreshPromises = new Map();
    stats = { hits: 0, misses: 0, revalidations: 0 };
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        this.logger.log('Warming up permission cache for active users...');
        const activeUsers = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true }
        });
        Promise.allSettled(activeUsers.map(u => this.getUserPermissionsWithScopes(u.id, true))).then(() => {
            this.logger.log(`Cache warmup complete. Cached ${this.permissionCache.size} active users.`);
        });
        setInterval(() => {
            const total = this.stats.hits + this.stats.misses;
            const rate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
            this.logger.log(`Cache Stats: ${this.stats.hits} hits, ${this.stats.misses} misses (${rate}% hit rate), ${this.stats.revalidations} bg-revalidations.`);
        }, 60 * 60 * 1000);
    }
    invalidateCache(userId) {
        this.permissionCache.delete(userId);
        this.logger.debug(`Invalidated permission cache for user: ${userId}`);
    }
    invalidateAllCache() {
        this.permissionCache.clear();
    }
    getScopeWeight(scope) {
        switch (scope) {
            case 'all': return 4;
            case 'department': return 3;
            case 'team': return 2;
            case 'self': return 1;
            default: return 0;
        }
    }
    async getUserPermissionsWithScopes(userId, forceRefresh = false) {
        const now = Date.now();
        const cached = this.permissionCache.get(userId);
        if (!forceRefresh && cached) {
            if (cached.expiry > now) {
                this.stats.hits++;
                return { permissions: cached.permissions, scopes: cached.scopes };
            }
            if (cached.expiry + this.SWR_TTL_MS > now) {
                this.stats.hits++;
                this.stats.revalidations++;
                if (!this.refreshPromises.has(userId)) {
                    const promise = this.refreshFromDb(userId).finally(() => this.refreshPromises.delete(userId));
                    this.refreshPromises.set(userId, promise);
                }
                return { permissions: cached.permissions, scopes: cached.scopes };
            }
        }
        this.stats.misses++;
        if (!forceRefresh && this.refreshPromises.has(userId)) {
            return this.refreshPromises.get(userId);
        }
        const promise = this.refreshFromDb(userId).finally(() => this.refreshPromises.delete(userId));
        this.refreshPromises.set(userId, promise);
        return promise;
    }
    async refreshFromDb(userId) {
        const now = Date.now();
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });
        const permSet = new Set();
        const scopes = {};
        for (const ur of userRoles) {
            if (!ur.role.isActive)
                continue;
            for (const rp of ur.role.rolePermissions) {
                const pSlug = rp.permission.slug;
                permSet.add(pSlug);
                const mod = rp.permission.module;
                const currentScope = scopes[mod];
                const newScope = rp.dataScope;
                if (!currentScope || this.getScopeWeight(newScope) > this.getScopeWeight(currentScope)) {
                    scopes[mod] = newScope;
                }
            }
        }
        if (userRoles.length === 0) {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (dbUser?.role) {
                const systemSlug = permissions_constants_1.LEGACY_ROLE_MAP[dbUser.role] || 'employee';
                const systemDef = permissions_constants_1.SYSTEM_ROLES.find((r) => r.slug === systemSlug);
                if (systemDef) {
                    for (const { slug: pSlug, dataScope } of systemDef.permissions) {
                        permSet.add(pSlug);
                        const mod = pSlug.split(':')[0];
                        const currentScope = scopes[mod];
                        if (!currentScope || this.getScopeWeight(dataScope) > this.getScopeWeight(currentScope)) {
                            scopes[mod] = dataScope;
                        }
                    }
                }
            }
        }
        const permissions = Array.from(permSet);
        this.permissionCache.set(userId, {
            permissions,
            scopes,
            expiry: now + this.CACHE_TTL_MS,
        });
        return { permissions, scopes };
    }
    async getAllPermissions() {
        return this.prisma.permission.findMany();
    }
    async getDataScope(userId, module) {
        const { scopes } = await this.getUserPermissionsWithScopes(userId);
        return scopes[module] || 'self';
    }
    async hasPermission(userId, slug) {
        const { permissions } = await this.getUserPermissionsWithScopes(userId);
        return permissions.includes(slug);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = PermissionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map
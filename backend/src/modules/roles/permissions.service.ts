import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LEGACY_ROLE_MAP, SYSTEM_ROLES } from './constants/permissions.constants';

// Memory cache for user permissions
interface CacheEntry {
  permissions: string[];
  scopes: Record<string, string>;
  expiry: number;
}

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  
  // 5 minute TTL for cached permissions
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  // 15 minute absolute expiry for stale-while-revalidate
  private readonly SWR_TTL_MS = 15 * 60 * 1000;

  private permissionCache = new Map<string, CacheEntry>();
  private refreshPromises = new Map<string, Promise<any>>();
  
  // Cache stats
  private stats = { hits: 0, misses: 0, revalidations: 0 };

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Warming up permission cache for active users...');
    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });
    // Warm up in background to not block startup
    Promise.allSettled(
      activeUsers.map(u => this.getUserPermissionsWithScopes(u.id, true))
    ).then(() => {
      this.logger.log(`Cache warmup complete. Cached ${this.permissionCache.size} active users.`);
    });

    setInterval(() => {
      const total = this.stats.hits + this.stats.misses;
      const rate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
      this.logger.log(`Cache Stats: ${this.stats.hits} hits, ${this.stats.misses} misses (${rate}% hit rate), ${this.stats.revalidations} bg-revalidations.`);
    }, 60 * 60 * 1000); // Log stats every hour
  }

  /**
   * Clears the permission cache for a user
   */
  invalidateCache(userId: string) {
    this.permissionCache.delete(userId);
    this.logger.debug(`Invalidated permission cache for user: ${userId}`);
  }
  
  /**
   * Clears the entire cache (useful for tenant-wide role changes)
   */
  invalidateAllCache() {
    this.permissionCache.clear();
  }

  /**
   * Helper function to determine relative scope breadth.
   * Higher number = broader scope.
   */
  private getScopeWeight(scope: string): number {
    switch (scope) {
      case 'all': return 4;
      case 'department': return 3;
      case 'team': return 2;
      case 'self': return 1;
      default: return 0;
    }
  }

  /**
   * Retrieves all aggregated permissions and data scopes for a user
   */
  async getUserPermissionsWithScopes(userId: string, forceRefresh = false): Promise<{ permissions: string[], scopes: Record<string, string> }> {
    const now = Date.now();
    const cached = this.permissionCache.get(userId);

    if (!forceRefresh && cached) {
      if (cached.expiry > now) {
        this.stats.hits++;
        return { permissions: cached.permissions, scopes: cached.scopes };
      }
      // Stale while revalidate
      if (cached.expiry + this.SWR_TTL_MS > now) {
        this.stats.hits++;
        this.stats.revalidations++;
        // Trigger background refresh if not already refreshing
        if (!this.refreshPromises.has(userId)) {
          const promise = this.refreshFromDb(userId).finally(() => this.refreshPromises.delete(userId));
          this.refreshPromises.set(userId, promise);
        }
        return { permissions: cached.permissions, scopes: cached.scopes };
      }
    }

    this.stats.misses++;
    
    // De-duplicate concurrent requests for the same user
    if (!forceRefresh && this.refreshPromises.has(userId)) {
      return this.refreshPromises.get(userId);
    }
    
    const promise = this.refreshFromDb(userId).finally(() => this.refreshPromises.delete(userId));
    this.refreshPromises.set(userId, promise);
    return promise;
  }

  private async refreshFromDb(userId: string): Promise<{ permissions: string[], scopes: Record<string, string> }> {
    const now = Date.now();

    // Load from DB
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

    const permSet = new Set<string>();
    const scopes: Record<string, string> = {};

    for (const ur of userRoles) {
      if (!ur.role.isActive) continue;

      for (const rp of ur.role.rolePermissions) {
        const pSlug = rp.permission.slug;
        permSet.add(pSlug);

        // Track broadest scope per module
        const mod = rp.permission.module;
        const currentScope = scopes[mod];
        const newScope = rp.dataScope;

        if (!currentScope || this.getScopeWeight(newScope) > this.getScopeWeight(currentScope)) {
          scopes[mod] = newScope;
        }
      }
    }

    // Users created before RBAC (or employees created without UserRole rows) only have User.role.
    // Without this, permission checks fail and departments / attendance APIs return 403.
    if (userRoles.length === 0) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (dbUser?.role) {
        const systemSlug = LEGACY_ROLE_MAP[dbUser.role] || 'employee';
        const systemDef = SYSTEM_ROLES.find((r) => r.slug === systemSlug);
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

    // Save to cache
    this.permissionCache.set(userId, {
      permissions,
      scopes,
      expiry: now + this.CACHE_TTL_MS,
    });

    return { permissions, scopes };
  }

  /**
   * Gets a list of all raw permissions.
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany();
  }

  /**
   * Find data scope for a specific module
   */
  async getDataScope(userId: string, module: string): Promise<string> {
    const { scopes } = await this.getUserPermissionsWithScopes(userId);
    return scopes[module] || 'self';
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, slug: string): Promise<boolean> {
    const { permissions } = await this.getUserPermissionsWithScopes(userId);
    return permissions.includes(slug);
  }
}

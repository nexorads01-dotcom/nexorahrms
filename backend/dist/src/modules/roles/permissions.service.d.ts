import { PrismaService } from '../../prisma/prisma.service';
export declare class PermissionsService {
    private readonly prisma;
    private readonly logger;
    private redisPub;
    private redisSub;
    private readonly redisChannel;
    private readonly CACHE_TTL_MS;
    private readonly SWR_TTL_MS;
    private permissionCache;
    private refreshPromises;
    private stats;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private initDistributedInvalidation;
    invalidateCache(userId: string): void;
    invalidateAllCache(): void;
    private getScopeWeight;
    getUserPermissionsWithScopes(userId: string, forceRefresh?: boolean): Promise<{
        permissions: string[];
        scopes: Record<string, string>;
    }>;
    private refreshFromDb;
    getAllPermissions(): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        module: string;
        action: string;
        category: string;
    }[]>;
    getDataScope(userId: string, module: string): Promise<string>;
    hasPermission(userId: string, slug: string): Promise<boolean>;
}

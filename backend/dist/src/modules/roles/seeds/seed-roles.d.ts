type PrismaTransactionClient = {
    permission: {
        upsert: (args: any) => Promise<any>;
        findUnique: (args: any) => Promise<any>;
        count: () => Promise<number>;
    };
    role: {
        upsert: (args: any) => Promise<any>;
        findFirst: (args: any) => Promise<any>;
    };
    rolePermission: {
        upsert: (args: any) => Promise<any>;
        deleteMany: (args: any) => Promise<any>;
        createMany: (args: any) => Promise<any>;
    };
    userRole: {
        upsert: (args: any) => Promise<any>;
    };
};
export declare function seedSystemRoles(prisma: PrismaTransactionClient, tenantId: string): Promise<Record<string, string>>;
export declare function assignRoleToUser(prisma: PrismaTransactionClient, userId: string, roleId: string): Promise<void>;
export {};

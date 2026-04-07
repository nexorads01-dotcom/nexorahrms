type PrismaTransactionClient = {
    permission: {
        upsert: (args: any) => Promise<any>;
        count: () => Promise<number>;
    };
};
export declare function seedPermissions(prisma: PrismaTransactionClient): Promise<number>;
export {};

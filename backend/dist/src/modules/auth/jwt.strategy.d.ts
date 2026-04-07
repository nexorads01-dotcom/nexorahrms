import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../roles/permissions.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private permissionsService;
    constructor(prisma: PrismaService, permissionsService: PermissionsService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
        tenantId: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        tenantId: string;
        employeeId: string | undefined;
        departmentId: string | null | undefined;
        name: string;
        permissions: string[];
        dataScopes: Record<string, string>;
    }>;
}
export {};

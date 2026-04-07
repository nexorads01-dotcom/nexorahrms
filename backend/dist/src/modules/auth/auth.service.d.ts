import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto/auth.dto';
import { PermissionsService } from '../roles/permissions.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private permissionsService;
    constructor(prisma: PrismaService, jwtService: JwtService, permissionsService: PermissionsService);
    register(dto: RegisterDto): Promise<{
        tenant: {
            id: string;
            name: string;
            subdomain: string;
        };
        user: {
            id: string;
            email: string;
            role: string;
        };
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        };
        user: {
            id: string;
            email: string;
            role: string;
            name: string;
            employee: {
                id: string;
            } | null;
            tenant: {
                id: string;
                name: string;
                subdomain: string;
            };
        };
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        role: string;
        roles: string[];
        employee: ({
            department: {
                name: string;
                id: string;
            } | null;
            designation: {
                name: string;
                id: string;
            } | null;
            reportingManager: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            email: string;
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            country: string | null;
            status: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            dateOfJoining: Date;
            dateOfLeaving: Date | null;
            employmentType: string;
            profilePhotoUrl: string | null;
            emergencyContact: string;
            bankDetails: string;
            customFields: string;
            departmentId: string | null;
            designationId: string | null;
            reportingManagerId: string | null;
            salaryStructureId: string | null;
            shiftId: string | null;
        }) | null;
        tenant: {
            name: string;
            subdomain: string;
            timezone: string;
            currency: string;
            id: string;
        };
        permissions: string[];
        dataScopes: Record<string, string>;
    }>;
    private generateTokens;
}

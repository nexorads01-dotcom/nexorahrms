import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
            tenant: {
                id: string;
                name: string;
                subdomain: string;
            };
        };
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        role: string;
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
            country: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
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
            userId: string | null;
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
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}

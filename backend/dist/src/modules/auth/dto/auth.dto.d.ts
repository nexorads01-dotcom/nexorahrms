export declare class RegisterDto {
    companyName: string;
    subdomain: string;
    adminFirstName: string;
    adminLastName: string;
    email: string;
    password: string;
    timezone?: string;
    currency?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

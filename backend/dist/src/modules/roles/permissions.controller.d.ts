import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        slug: string;
        module: string;
        action: string;
        category: string;
    }[]>;
}

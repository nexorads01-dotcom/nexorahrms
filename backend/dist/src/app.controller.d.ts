import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    root(): {
        name: string;
        swagger: string;
        apiPrefix: string;
    };
    apiInfo(): {
        message: string;
        swaggerUi: string;
        openApiJson: string;
        restBase: string;
    };
    health(): {
        status: string;
        timestamp: string;
    };
    readiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
}

export declare class AppController {
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
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const auth_service_1 = require("./src/modules/auth/auth.service");
async function run() {
    console.log('Starting scaffold...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    console.log('Registering default tenant (Acme Corp)...');
    try {
        await authService.register({
            companyName: 'Acme Corp',
            subdomain: 'acme',
            adminFirstName: 'John',
            adminLastName: 'Doe',
            email: 'admin@acme.com',
            password: 'DemoPassword123!',
            timezone: 'UTC',
            currency: 'USD'
        });
        console.log('✅ Tenant registered!');
    }
    catch (error) {
        if (error.message && error.message.includes('taken')) {
            console.log('✅ Tenant already exists, continuing...');
        }
        else {
            console.error('Failed to register tenant:', error);
        }
    }
    await app.close();
    console.log('Now running the seed script...');
}
run().then(() => {
    require('./prisma/seed.ts');
}).catch(console.error);
//# sourceMappingURL=scaffold.js.map
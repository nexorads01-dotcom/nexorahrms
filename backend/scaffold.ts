import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/modules/auth/auth.service';

async function run() {
  console.log('Starting scaffold...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  
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
  } catch (error: any) {
    if (error.message && error.message.includes('taken')) {
      console.log('✅ Tenant already exists, continuing...');
    } else {
      console.error('Failed to register tenant:', error);
    }
  }
  
  await app.close();
  console.log('Now running the seed script...');
}
run().then(() => {
  require('./prisma/seed.ts');
}).catch(console.error);

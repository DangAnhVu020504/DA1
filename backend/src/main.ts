import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedAdmin } from './seed';
import { ListingsService } from './listings/listings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để Frontend có thể gọi API
  app.enableCors();

  await seedAdmin(app);

  // Auto-migrate: Create listings for all properties that don't have one
  try {
    const listingsService = app.get(ListingsService);
    const result = await listingsService.migrateListingsForProperties();
    console.log('Listings migration:', result.message);
  } catch (error) {
    console.error('Listings migration failed:', error.message);
  }

  await app.listen(3000);
}
bootstrap();


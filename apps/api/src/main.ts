import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Port is fixed until task 0.3 introduces validated config (architecture §7).
const PORT = 4000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}

await bootstrap();

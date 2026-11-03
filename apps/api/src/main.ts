import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Env } from './config/index.js';

async function bootstrap(): Promise<void> {
  // abortOnError: false so a failed boot exits 1 here instead of process.abort().
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}

try {
  await bootstrap();
} catch (error: unknown) {
  // Name and message only: env errors carry variable names, never values (architecture §8).
  const reason = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
  console.error(`API failed to start. ${reason}`);
  process.exit(1);
}

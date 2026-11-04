import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './common/app-setup.js';
import type { Env } from './config/index.js';

async function bootstrap(): Promise<void> {
  // abortOnError: false so a failed boot exits 1 here instead of process.abort().
  // bodyParser: false because configureApp registers a JSON-only parser.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    bodyParser: false,
    bufferLogs: true,
  });
  configureApp(app);
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

import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseError } from 'mongoose';
import { LoggingModule } from './common/logging/logger.module.js';
import { type Env, validateEnv } from './config/index.js';
import { UsersModule } from './users/users.module.js';

/** Fail fast when Mongo is unreachable (architecture §8): one 5 s attempt, no retries. */
const MONGO_SERVER_SELECTION_TIMEOUT_MS = 5000;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // apps/api/.env, resolved from src/ or dist/ alike. Real process env wins over the file.
      envFilePath: join(import.meta.dirname, '..', '.env'),
      validate: validateEnv,
    }),
    LoggingModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
        serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
        retryAttempts: 0,
        // Rethrow name and message only: the raw error carries the topology dump and URI options.
        connectionErrorFactory: (error) => new MongooseError(`${error.name}: ${error.message}`),
      }),
    }),
    UsersModule,
  ],
})
export class AppModule {}

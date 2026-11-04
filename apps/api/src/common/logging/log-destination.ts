import { Global, Module } from '@nestjs/common';
import type { DestinationStream } from 'pino';

/** Optional pino destination. Undefined in the app; tests override it to capture log output. */
export const LOG_DESTINATION = Symbol('LOG_DESTINATION');

@Global()
@Module({
  providers: [{ provide: LOG_DESTINATION, useValue: undefined }],
  exports: [LOG_DESTINATION],
})
export class LogDestinationModule {}

export type LogDestination = DestinationStream | undefined;

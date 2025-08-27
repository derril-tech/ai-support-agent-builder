import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class Logger extends ConsoleLogger {
  private readonly pino = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  });

  log(message: any, context?: string) {
    this.pino.info({ context }, message);
    super.log(message, context);
  }
  error(message: any, trace?: string, context?: string) {
    this.pino.error({ context, trace }, message);
    super.error(message, trace, context);
  }
  warn(message: any, context?: string) {
    this.pino.warn({ context }, message);
    super.warn(message, context);
  }
  debug(message: any, context?: string) {
    this.pino.debug({ context }, message);
    super.debug?.(message, context);
  }
  verbose(message: any, context?: string) {
    this.pino.trace({ context }, message);
    super.verbose?.(message, context);
  }
}


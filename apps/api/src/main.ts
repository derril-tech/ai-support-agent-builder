import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { ProblemDetailsFilter } from './common/filters/problem-details.filter';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { Logger } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });

  const configService = app.get(ConfigService);

  // Sentry init
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({ dsn: sentryDsn, tracesSampleRate: 0.1 });
  }

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService
      .get('CORS_ORIGINS', 'http://localhost:3000')
      .split(','),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('v1');

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
    new ZodValidationPipe(),
  );

  // Problem Details filter
  app.useGlobalFilters(new ProblemDetailsFilter());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('AI Support Agent Builder API')
    .setDescription(
      'API for building, deploying, and monitoring AI support agents',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('agents', 'AI agent management')
    .addTag('knowledge', 'Knowledge base management')
    .addTag('deployments', 'Agent deployments')
    .addTag('conversations', 'Conversation management')
    .addTag('analytics', 'Analytics and reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API documentation available at: http://localhost:${port}/api`);
}

bootstrap();

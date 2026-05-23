import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer, ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { setupDocs } from './doc/scala.doc';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

type ValidationErrorDetail = {
  field: string;
  message: string;
};

function flattenValidationErrors(
  errors: ValidationError[],
): ValidationErrorDetail[] {
  const details: ValidationErrorDetail[] = [];

  const walk = (error: ValidationError): void => {
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        details.push({
          field: error.property,
          message,
        });
      }
    }

    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        walk(child);
      }
    }
  };

  for (const error of errors) {
    walk(error);
  }

  return details;
}

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  // Testing only — allow any origin, method, and header on all routes
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      forbidNonWhitelisted: false,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) =>
        new UnprocessableEntityException({
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: flattenValidationErrors(errors),
        }),
    }),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  setupDocs(app);

  app.useGlobalInterceptors(new ResponseInterceptor());
  // app.useGlobalFilters(new HttpExceptionFilter());

  return app;
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();

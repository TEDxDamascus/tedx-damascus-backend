import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { useContainer, ValidationError } from 'class-validator';
import serverless from 'serverless-http';
import { AppModule } from './app.module';
import { docsCdnRewriteMiddleware, setupDocs } from './doc/scala.doc';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
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

  // Rewrite docs HTML to load Swagger UI static assets from CDN (fixes 404 on Vercel/serverless).
  app.use(docsCdnRewriteMiddleware);
  setupDocs(app);

  app.useGlobalInterceptors(new ResponseInterceptor());
  // app.useGlobalFilters(new HttpExceptionFilter());

  return app;
}

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
}

/** Vercel sets VERCEL=1 for builds and serverless runtime. */
function isVercelServerless(): boolean {
  return process.env.VERCEL === '1';
}

let cachedHandler: ReturnType<typeof serverless> | undefined;

export default async function handler(req: unknown, res: unknown) {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverless(expressApp);
  }
  return cachedHandler(req as never, res as never);
}

if (!isVercelServerless()) {
  void bootstrap();
}

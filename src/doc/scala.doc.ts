import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';

/** CDN base URL for swagger-ui-dist (same version as @nestjs/swagger dependency). */
const SWAGGER_UI_CDN_BASE =
  'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.31.0';

const DOCS_PATHS = ['/docs', '/docs/', '/docs/index.html'];

/**
 * Middleware that rewrites Swagger docs HTML to load static assets (CSS, bundle, preset)
 * from a CDN. Use when the app runs in environments where node_modules static files
 * are not served (e.g. Vercel serverless). The dynamic swagger-ui-init.js still loads
 * from the app. Must be registered before setupDocs().
 */
export function docsCdnRewriteMiddleware(
  req: { path?: string; url?: string },
  res: {
    send: (body: unknown) => unknown;
    getHeader: (name: string) => string | number | string[] | undefined;
  },
  next: () => void,
): void {
  const path = req.path ?? (req.url?.split('?')[0] ?? '');
  if (!DOCS_PATHS.some((p) => path === p || path.endsWith(p))) {
    return next();
  }
  const originalSend = res.send.bind(res);
  res.send = function (body: unknown): unknown {
    if (
      typeof body === 'string' &&
      (res.getHeader('Content-Type') as string)?.includes('text/html') &&
      body.includes('swagger-ui') &&
      body.includes('swagger-ui-init.js')
    ) {
      body = body
        .replace(
          /href=["']\.\/docs\/swagger-ui\.css["']/g,
          `href="${SWAGGER_UI_CDN_BASE}/swagger-ui.css"`,
        )
        .replace(
          /src=["']\.\/docs\/swagger-ui-bundle\.js["']/g,
          `src="${SWAGGER_UI_CDN_BASE}/swagger-ui-bundle.js"`,
        )
        .replace(
          /src=["']\.\/docs\/swagger-ui-standalone-preset\.js["']/g,
          `src="${SWAGGER_UI_CDN_BASE}/swagger-ui-standalone-preset.js"`,
        )
        .replace(
          /href=["']\.\/docs\/favicon-32x32\.png["']/g,
          `href="${SWAGGER_UI_CDN_BASE}/favicon-32x32.png"`,
        )
        .replace(
          /href=["']\.\/docs\/favicon-16x16\.png["']/g,
          `href="${SWAGGER_UI_CDN_BASE}/favicon-16x16.png"`,
        );
    }
    return originalSend(body);
  };
  next();
}

export function setupDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('TEDx Damascus API')
    .setDescription('Official backend API for TEDx Damascus platform.')
    .setVersion('1.0.0')
    .setContact(
      'TEDx Damascus Tech Team',
      'https://tedxdamascus.com',
      'tech@tedxdamascus.com',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Explicit path to swagger-ui-dist so assets (CSS/JS) load correctly and the UI is not blank.
  // Resolve from require so it works regardless of process.cwd() (e.g. when running from dist/).
  const swaggerUiPath = (() => {
    try {
      return resolve(
        require.resolve('swagger-ui-dist/package.json'),
        '..',
      );
    } catch {
      return resolve(process.cwd(), 'node_modules', 'swagger-ui-dist');
    }
  })();

  SwaggerModule.setup('docs', app, document, {
    customSwaggerUiPath: swaggerUiPath,
  });
}

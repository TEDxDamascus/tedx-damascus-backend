import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';

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

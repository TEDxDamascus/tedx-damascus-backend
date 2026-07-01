import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';

export function setupDocs(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('TEDx Damascus API')
    .setDescription(
      'Official backend API for TEDx Damascus platform.\n\n' +
        'Forms APIs:\n' +
        '- Use /forms endpoints to define localized form templates with typed questions (short_text, long_text, single_choice, checkbox_group, date, phone_number, url, rating, date_range, file_upload).\n' +
        '- Question config controls validation, e.g. rating { min, max } and date_range { min_date, max_date }.\n' +
        '- For file_upload questions, upload via POST /forms/:id/upload (multipart file, same availability rules as submit), then submit the returned URL string as the answer value.\n' +
        '- Drafts: PUT /forms/:id/draft saves partial answers (no required-field validation). POST /forms/:id/submit performs full validation and finalizes; an existing draft is upgraded to submitted. Only submitted rows count toward max_submissions.',
    )
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
      return resolve(require.resolve('swagger-ui-dist/package.json'), '..');
    } catch {
      return resolve(process.cwd(), 'node_modules', 'swagger-ui-dist');
    }
  })();

  SwaggerModule.setup('docs', app, document, {
    customSwaggerUiPath: swaggerUiPath,
  });
}

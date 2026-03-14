import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
  SwaggerModule.setup('docs', app, document);
}

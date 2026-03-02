import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

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
        description: 'Enter JWT access token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  //! swagger
  // SwaggerModule.setup('docs', app, swgDocument);
  //! Scala
  app.use(
    '/docs',
    apiReference({
      content: document,
      title: 'TEDx Damascus API',
      pageTitle: 'TEDx Damascus API Documentation',
      theme: 'default',
      showDeveloperTools: 'never',
      defaultOpenFirstTag: false,
      defaultOpenAllTags: true,
      hideModels: true,
      hiddenClients: true,
      hideClientButton: true,
      expandAllModelSections: false,
      expandAllResponses: false,
      hideDownloadButton: true,
      telemetry: false,
      showOperationId: false,
      orderRequiredPropertiesFirst: true,
      orderSchemaPropertiesBy: 'preserve',
      agent: {
        disabled: false,
      },
      authentication: {
        preferredSecurityScheme: 'bearer',
      },
    }),
  );
}

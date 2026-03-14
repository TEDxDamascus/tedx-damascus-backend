import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function setupDocs(app: INestApplication) {
  // Dynamic import with eval prevents transpiler from converting to require(),
  // which would fail because @scalar/core is ESM-only (ERR_REQUIRE_ESM)
  const scalar = await eval(
    "import('@scalar/nestjs-api-reference')",
  ) as { apiReference: (options: Record<string, unknown>) => unknown };
  const { apiReference } = scalar;
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

  //! swagger
  // SwaggerModule.setup('docs', app, swgDocument);
  //! Scala
  app.use(
    '/docs',
    apiReference({
      hideSearch: false,
      content: document,
      title: 'TEDx Damascus API',
      pageTitle: 'TEDx Damascus API Documentation',
      theme: 'default',
      showDeveloperTools: 'never',
      defaultOpenFirstTag: false,
      defaultOpenAllTags: false,
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
        hideAddApi: true,
      },
      authentication: {
        preferredSecurityScheme: 'bearer',
      },
    }),
  );
}

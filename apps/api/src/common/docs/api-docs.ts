import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const DOCS_PATH = 'docs';

/**
 * OpenAPI docs at /docs (UI) and /docs/json, mounted only outside production (architecture §10, swagger ADR).
 * The session is the httpOnly `access_token` cookie, described as a cookie auth scheme.
 */
export function mountApiDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription(
      'Signup, signin, session check and logout. Bodies are JSON only (10 KB). Every error uses the §4 error shape.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie', name: 'access_token' }, 'session')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // JSON only: without `raw`, Swagger also serves a YAML copy at /docs-yaml.
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/json`,
    raw: ['json'],
  });
}

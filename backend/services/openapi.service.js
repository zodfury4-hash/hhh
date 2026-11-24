function getOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'HEA Link Public REST API',
      version: '1.0.0',
      description:
        'Official REST API for HEA Link: High-speed URL shortening, QR code generation, click telemetry, and branded domain resolution.',
      contact: {
        name: 'HEA Link Developer Support',
        url: 'https://healink.store/developers'
      }
    },
    servers: [
      {
        url: 'https://healink.store/api/v1',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key (hea_live_... / hea_test_...)',
          description: 'Provide your API key in the Authorization header: `Bearer hea_live_...`'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Provide your API key in the custom header: `X-API-Key: hea_live_...`'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request payload.' },
                details: { type: 'array', items: { type: 'object' } },
                requestId: { type: 'string', example: 'req_a1b2c3d4' }
              },
              required: ['code', 'message', 'requestId']
            }
          }
        },
        LinkObject: {
          type: 'object',
          properties: {
            slug: { type: 'string', example: 'launch-2026' },
            dest: { type: 'string', example: 'https://example.com/product' },
            shortUrl: { type: 'string', example: 'https://healink.store/launch-2026' },
            title: { type: 'string', example: 'Product Launch Campaign' },
            tag: { type: 'string', example: 'marketing' },
            isTest: { type: 'boolean', example: false },
            totalClicks: { type: 'number', example: 42 },
            hasPassword: { type: 'boolean', example: false },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] },
      { ApiKeyAuth: [] }
    ],
    paths: {
      '/links': {
        post: {
          summary: 'Create a short link',
          description: 'Create a new branded short link with optional custom slug, tags, passcode, and expiration.',
          parameters: [
            {
              name: 'Idempotency-Key',
              in: 'header',
              required: false,
              schema: { type: 'string' },
              description: 'Unique client-generated key to prevent duplicate creation within 24 hours.'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    dest: { type: 'string', format: 'uri', example: 'https://mysite.com/article' },
                    slug: { type: 'string', example: 'summer-sale' },
                    title: { type: 'string', example: 'Summer Campaign' },
                    tag: { type: 'string', example: 'promo' },
                    password: { type: 'string', minLength: 4 },
                    expiresAt: { type: 'string', format: 'date-time' }
                  },
                  required: ['dest']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Link created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/LinkObject' },
                      meta: { type: 'object' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/Error' },
            '401': { $ref: '#/components/responses/Error' },
            '409': { description: 'Slug conflict' }
          }
        },
        get: {
          summary: 'List short links',
          description: 'Retrieve paginated links for the authenticated user using cursor-based pagination.',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
            { name: 'cursor', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term' },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
          ],
          responses: {
            '200': {
              description: 'Paginated list of links',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/LinkObject' } },
                      pagination: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/links/{slug}': {
        get: {
          summary: 'Get link details',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Link details' },
            '404': { description: 'Link not found' }
          }
        },
        patch: {
          summary: 'Update link',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    dest: { type: 'string', format: 'uri' },
                    title: { type: 'string' },
                    tag: { type: 'string' },
                    password: { type: 'string', nullable: true },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Link updated' },
            '404': { description: 'Link not found' }
          }
        },
        delete: {
          summary: 'Delete link',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Link deleted' },
            '404': { description: 'Link not found' }
          }
        }
      },
      '/links/{slug}/analytics': {
        get: {
          summary: 'Get link click analytics',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'range', in: 'query', schema: { type: 'string', enum: ['24h', '7d', '30d', '90d'], default: '7d' } }
          ],
          responses: {
            '200': { description: 'Analytics breakdown' }
          }
        }
      },
      '/analytics': {
        get: {
          summary: 'Get aggregate audience telemetry',
          parameters: [
            { name: 'range', in: 'query', schema: { type: 'string', enum: ['24h', '7d', '30d', '90d'], default: '7d' } }
          ],
          responses: {
            '200': { description: 'Account-wide analytics' }
          }
        }
      },
      '/qr': {
        post: {
          summary: 'Generate high-res QR code',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    size: { type: 'integer', default: 300, minimum: 64, maximum: 1024 },
                    format: { type: 'string', enum: ['png', 'svg'], default: 'png' }
                  },
                  required: ['url']
                }
              }
            }
          },
          responses: {
            '200': { description: 'QR Code metadata and direct image URLs' }
          }
        }
      },
      '/domains': {
        get: {
          summary: 'List verified branded domains',
          responses: {
            '200': { description: 'List of active custom domains' }
          }
        }
      },
      '/me': {
        get: {
          summary: 'Get API account and quota details',
          responses: {
            '200': { description: 'Current user plan, rate limits, and month usage' }
          }
        }
      }
    }
  };
}

module.exports = {
  getOpenApiSpec
};

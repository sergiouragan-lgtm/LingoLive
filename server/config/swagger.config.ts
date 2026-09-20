/**
 * Swagger/OpenAPI Configuration
 * Defines API documentation metadata and endpoint specifications
 */

export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LingoLive API',
      version: '1.0.0',
      description: `
Comprehensive REST API for LingoLive - AI-powered language learning platform.

## Features
- Multi-language support (English, Spanish, French, Portuguese, Italian, German, Japanese, Chinese)
- Real-time learning analytics and progress tracking
- AI-powered tutoring with OpenAI integration
- Gamification and achievement system
- Payment processing with Stripe and Paypal
- E-book curation and marketplace
- Live class scheduling and management
- Subscription management and billing

## Authentication
All protected endpoints require Bearer token authentication via Firebase ID tokens.

\`\`\`
Authorization: Bearer {idToken}
\`\`\`

## Security
- CORS with origin whitelisting
- Rate limiting: 100 requests/15 min (general), 5 requests/15 min (auth)
- Input validation with Zod schemas
- Security headers (CSP, HSTS, X-Frame-Options)
- HTTPS enforcement in production
      `.trim(),
      contact: {
        name: 'LingoLive Support',
        url: 'https://lingolive.com/support',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:5173/api',
        description: 'Development server',
      },
      {
        url: 'https://lingolive.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID token (Bearer token)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              description: 'Detailed error information',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                    example: 'words.0.word',
                  },
                  message: {
                    type: 'string',
                    example: 'String must contain at least 1 character(s)',
                  },
                  code: {
                    type: 'string',
                    example: 'too_small',
                  },
                },
              },
            },
          },
        },
        VocabWord: {
          type: 'object',
          required: ['word', 'definition', 'language'],
          properties: {
            word: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'The vocabulary word',
              example: 'serendipity',
            },
            definition: {
              type: 'string',
              maxLength: 500,
              description: 'Word definition',
              example: 'The occurrence of events by chance in a happy or beneficial way',
            },
            language: {
              type: 'string',
              enum: ['en', 'es', 'fr', 'pt', 'it', 'de', 'ja', 'zh'],
              description: 'Language code (ISO 639-1)',
              example: 'en',
            },
            pronunciation: {
              type: 'string',
              description: 'IPA pronunciation',
              example: 'ˌserənˈdɪpɪti',
            },
            exampleSentence: {
              type: 'string',
              maxLength: 1000,
              description: 'Example usage in a sentence',
              example: 'It was pure serendipity that we met at the conference.',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              maxLength: 100,
            },
            bio: {
              type: 'string',
              maxLength: 500,
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
            },
            preferences: {
              type: 'object',
              properties: {
                language: {
                  type: 'string',
                  enum: ['en', 'es', 'fr', 'pt', 'it', 'de', 'ja', 'zh'],
                },
                theme: {
                  type: 'string',
                  enum: ['light', 'dark', 'auto'],
                },
                notifications: {
                  type: 'boolean',
                },
              },
            },
          },
        },
        PaymentIntent: {
          type: 'object',
          required: ['amount', 'currency'],
          properties: {
            amount: {
              type: 'integer',
              minimum: 100,
              maximum: 999999,
              description: 'Amount in cents (e.g., 10000 = $100.00)',
              example: 10000,
            },
            currency: {
              type: 'string',
              enum: ['USD', 'EUR', 'BRL', 'GBP'],
              default: 'USD',
            },
            subscriptionPlanId: {
              type: 'string',
              description: 'Optional subscription plan ID',
            },
            metadata: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              description: 'Custom metadata for tracking',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },

  apis: [
    './server/routes/*.routes.ts',
    './server/routes/**/*.routes.ts',
  ],
};

export const swaggerOptions = {
  customCss: `
    .swagger-ui {
      background: #f5f5f5;
    }
    .swagger-ui .topbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .swagger-ui .info .title {
      font-weight: 700;
    }
  `,
  customSiteTitle: 'LingoLive API Documentation',
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
};

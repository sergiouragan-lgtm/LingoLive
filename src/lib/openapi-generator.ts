import fs from 'fs';
import path from 'path';

export interface OpenAPIEndpoint {
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
  security?: string[];
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

class OpenAPIGenerator {
  private spec: OpenAPISpec;

  constructor() {
    this.spec = {
      openapi: '3.0.0',
      info: {
        title: 'LingoLive API',
        version: '1.0.0',
        description: 'Complete API documentation for LingoLive Phases 38-45',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
        {
          url: 'https://api.lingolive.com/api',
          description: 'Production server',
        },
      ],
      paths: {},
      components: {
        schemas: this.getCommonSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }

  private getCommonSchemas() {
    return {
      Error: {
        type: 'object',
        required: ['error', 'statusCode'],
        properties: {
          error: { type: 'string' },
          statusCode: { type: 'number' },
        },
      },
      FeatureFlag: {
        type: 'object',
        properties: {
          flagId: { type: 'string' },
          name: { type: 'string' },
          enabled: { type: 'boolean' },
          rollout: { type: 'number', minimum: 0, maximum: 100 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ABTest: {
        type: 'object',
        properties: {
          testId: { type: 'string' },
          name: { type: 'string' },
          control: { type: 'string' },
          variant: { type: 'string' },
          splitPercentage: { type: 'number' },
        },
      },
      Recommendation: {
        type: 'object',
        properties: {
          recommendationId: { type: 'string' },
          userId: { type: 'string' },
          itemId: { type: 'string' },
          itemType: { type: 'string' },
          score: { type: 'number' },
          reason: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          notificationId: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: {
            type: 'string',
            enum: ['info', 'success', 'warning', 'error'],
          },
          read: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    };
  }

  addEndpoint(endpoint: OpenAPIEndpoint) {
    const pathKey = endpoint.path;
    const methodKey = endpoint.method.toLowerCase();

    if (!this.spec.paths[pathKey]) {
      this.spec.paths[pathKey] = {};
    }

    this.spec.paths[pathKey][methodKey] = {
      summary: endpoint.summary,
      tags: endpoint.tags,
      parameters: endpoint.parameters || [],
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security || [{ bearerAuth: [] }],
    };
  }

  generateSpec(): OpenAPISpec {
    // Add common endpoints from phases 38-45
    this.addCommonEndpoints();
    return this.spec;
  }

  private addCommonEndpoints() {
    // Feature Flags (Phase 42)
    this.addEndpoint({
      method: 'GET',
      path: '/features',
      summary: 'List all feature flags',
      tags: ['Feature Flags'],
      responses: {
        '200': {
          description: 'List of feature flags',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/FeatureFlag' },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    });

    this.addEndpoint({
      method: 'POST',
      path: '/features/create',
      summary: 'Create a new feature flag',
      tags: ['Feature Flags'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'rollout'],
              properties: {
                name: { type: 'string' },
                rollout: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Feature flag created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FeatureFlag' },
            },
          },
        },
        '400': { description: 'Bad request' },
        '401': { description: 'Unauthorized' },
      },
    });

    // A/B Testing (Phase 42)
    this.addEndpoint({
      method: 'GET',
      path: '/abtesting',
      summary: 'List all A/B tests',
      tags: ['A/B Testing'],
      responses: {
        '200': {
          description: 'List of A/B tests',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ABTest' },
              },
            },
          },
        },
      },
    });

    // Recommendations (Phase 42)
    this.addEndpoint({
      method: 'GET',
      path: '/recommendations/{userId}',
      summary: 'Get recommendations for a user',
      tags: ['Recommendations'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'User recommendations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Recommendation' },
              },
            },
          },
        },
      },
    });

    // Notifications (Phase 43)
    this.addEndpoint({
      method: 'GET',
      path: '/notifications/user/{userId}',
      summary: 'Get user notifications',
      tags: ['Notifications'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'User notifications',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Notification' },
              },
            },
          },
        },
      },
    });

    this.addEndpoint({
      method: 'POST',
      path: '/notifications/send',
      summary: 'Send a notification',
      tags: ['Notifications'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'title', 'message'],
              properties: {
                userId: { type: 'string' },
                title: { type: 'string' },
                message: { type: 'string' },
                type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Notification sent',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Notification' },
            },
          },
        },
      },
    });

    // Monitoring (Phase 44)
    this.addEndpoint({
      method: 'GET',
      path: '/monitoring/dashboard',
      summary: 'Get monitoring dashboard data',
      tags: ['Monitoring'],
      responses: {
        '200': {
          description: 'Dashboard data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  health: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
                  metrics: { type: 'object' },
                  lastUpdated: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    });

    // Analytics (Phase 41)
    this.addEndpoint({
      method: 'POST',
      path: '/analytics/track',
      summary: 'Track an analytics event',
      tags: ['Analytics'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'eventType'],
              properties: {
                userId: { type: 'string' },
                eventType: { type: 'string' },
                eventData: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Event tracked' },
      },
    });

    // Caching (Phase 43)
    this.addEndpoint({
      method: 'GET',
      path: '/cache/{key}',
      summary: 'Get cached value',
      tags: ['Cache'],
      parameters: [
        {
          name: 'key',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Cached value' },
        '404': { description: 'Not found' },
      },
    });

    this.addEndpoint({
      method: 'POST',
      path: '/cache/{key}',
      summary: 'Set cache value',
      tags: ['Cache'],
      parameters: [
        {
          name: 'key',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                value: { type: 'object' },
                ttl: { type: 'number', description: 'TTL in seconds' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Value cached' },
      },
    });
  }

  saveToFile(filepath: string) {
    const spec = this.generateSpec();
    fs.writeFileSync(filepath, JSON.stringify(spec, null, 2));
    console.log(`OpenAPI spec saved to ${filepath}`);
  }
}

export function generateOpenAPI(outputPath: string) {
  const generator = new OpenAPIGenerator();
  generator.saveToFile(outputPath);
}

import * as fs from 'fs';
import * as path from 'path';

// Complete OpenAPI 3.0 specification for LingoLive phases 38-45
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact: { name: string; email: string };
    license: { name: string; url: string };
  };
  servers: Array<{ url: string; description: string; variables?: Record<string, any> }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  security: Array<Record<string, any>>;
  tags: Array<{ name: string; description: string }>;
}

function generateOpenAPISpec(): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'LingoLive API',
      version: '2.0.0',
      description: 'Complete API specification for LingoLive platform - Phases 38-45',
      contact: {
        name: 'LingoLive Support',
        email: 'support@lingolive.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server',
        variables: {
          basePath: { default: '/api' },
        },
      },
      {
        url: 'https://api.lingolive.com',
        description: 'Production Server',
      },
      {
        url: 'https://staging-api.lingolive.com',
        description: 'Staging Server',
      },
    ],
    paths: {
      // Phase 38: Workflow Automation
      '/workflows': {
        get: {
          tags: ['Workflows'],
          summary: 'List all workflows',
          operationId: 'listWorkflows',
          parameters: [
            { name: 'userId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'enabled', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            200: {
              description: 'List of workflows',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Workflow' },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ['Workflows'],
          summary: 'Create a new workflow',
          operationId: 'createWorkflow',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkflowCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'Workflow created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workflow' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/workflows/{workflowId}': {
        get: {
          tags: ['Workflows'],
          summary: 'Get workflow details',
          operationId: 'getWorkflow',
          parameters: [{ name: 'workflowId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Workflow details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workflow' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ['Workflows'],
          summary: 'Update workflow',
          operationId: 'updateWorkflow',
          parameters: [{ name: 'workflowId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkflowUpdate' },
              },
            },
          },
          responses: {
            200: {
              description: 'Workflow updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workflow' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/workflows/{workflowId}/execute': {
        post: {
          tags: ['Workflows'],
          summary: 'Execute a workflow',
          operationId: 'executeWorkflow',
          parameters: [{ name: 'workflowId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    inputs: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Workflow execution started',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WorkflowExecution' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/workflows/executions/{executionId}': {
        get: {
          tags: ['Workflows'],
          summary: 'Get workflow execution status',
          operationId: 'getWorkflowExecution',
          parameters: [{ name: 'executionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Execution status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WorkflowExecution' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 39: Caching
      '/cache/{key}': {
        get: {
          tags: ['Caching'],
          summary: 'Get cached value',
          operationId: 'getCacheValue',
          parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Cached value',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            404: { description: 'Cache key not found' },
          },
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ['Caching'],
          summary: 'Set cached value',
          operationId: 'setCacheValue',
          parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    value: { type: 'object' },
                    ttlSeconds: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Value cached' },
          },
          security: [{ bearerAuth: [] }],
        },
        delete: {
          tags: ['Caching'],
          summary: 'Delete cached value',
          operationId: 'deleteCacheValue',
          parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Cache deleted' },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/cache/stats': {
        get: {
          tags: ['Caching'],
          summary: 'Get cache statistics',
          operationId: 'getCacheStats',
          responses: {
            200: {
              description: 'Cache statistics',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CacheStats' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 42: Feature Flags & A/B Testing
      '/features': {
        get: {
          tags: ['Feature Flags'],
          summary: 'List feature flags',
          operationId: 'listFeatureFlags',
          responses: {
            200: {
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
          },
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ['Feature Flags'],
          summary: 'Create feature flag',
          operationId: 'createFeatureFlag',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeatureFlagCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'Feature flag created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FeatureFlag' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/features/{flagId}': {
        get: {
          tags: ['Feature Flags'],
          summary: 'Get feature flag details',
          operationId: 'getFeatureFlag',
          parameters: [{ name: 'flagId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Feature flag details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FeatureFlag' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ['Feature Flags'],
          summary: 'Update feature flag',
          operationId: 'updateFeatureFlag',
          parameters: [{ name: 'flagId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeatureFlagUpdate' },
              },
            },
          },
          responses: {
            200: {
              description: 'Feature flag updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FeatureFlag' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 42: A/B Testing
      '/abtesting': {
        get: {
          tags: ['A/B Testing'],
          summary: 'List A/B tests',
          operationId: 'listABTests',
          parameters: [
            { name: 'enabled', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 50 } },
          ],
          responses: {
            200: {
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
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ['A/B Testing'],
          summary: 'Create A/B test',
          operationId: 'createABTest',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ABTestCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'A/B test created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ABTest' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/abtesting/{testId}/results': {
        get: {
          tags: ['A/B Testing'],
          summary: 'Get A/B test results',
          operationId: 'getABTestResults',
          parameters: [{ name: 'testId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Test results',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TestResult' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 41: Compliance & Analytics
      '/compliance/audit-trail': {
        get: {
          tags: ['Compliance'],
          summary: 'Get audit trail',
          operationId: 'getAuditTrail',
          parameters: [
            { name: 'userId', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 100 } },
          ],
          responses: {
            200: {
              description: 'Audit trail records',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AuditRecord' },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/compliance/data-access-logs': {
        post: {
          tags: ['Compliance'],
          summary: 'Log data access event',
          operationId: 'logDataAccess',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    resourceId: { type: 'string' },
                    action: { type: 'string', enum: ['read', 'write', 'delete'] },
                  },
                  required: ['userId', 'resourceId', 'action'],
                },
              },
            },
          },
          responses: {
            201: { description: 'Access logged' },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 43: Notifications
      '/notifications/user/{userId}': {
        get: {
          tags: ['Notifications'],
          summary: 'Get user notifications',
          operationId: 'getUserNotifications',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'unreadOnly', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 50 } },
          ],
          responses: {
            200: {
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
          security: [{ bearerAuth: [] }],
        },
      },
      '/notifications/{notificationId}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          operationId: 'markNotificationRead',
          parameters: [{ name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Notification marked as read' },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/notifications/send': {
        post: {
          tags: ['Notifications'],
          summary: 'Send notification',
          operationId: 'sendNotification',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationSend' },
              },
            },
          },
          responses: {
            201: {
              description: 'Notification sent',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Notification' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 44: Monitoring
      '/monitoring/monitors': {
        get: {
          tags: ['Monitoring'],
          summary: 'List monitors',
          operationId: 'listMonitors',
          responses: {
            200: {
              description: 'List of monitors',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Monitor' },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ['Monitoring'],
          summary: 'Create monitor',
          operationId: 'createMonitor',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MonitorCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'Monitor created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Monitor' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/monitoring/metrics/{metricName}': {
        get: {
          tags: ['Monitoring'],
          summary: 'Get metric data',
          operationId: 'getMetric',
          parameters: [
            { name: 'metricName', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'startTime', in: 'query', schema: { type: 'string', format: 'date-time' } },
            { name: 'endTime', in: 'query', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: {
            200: {
              description: 'Metric data',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MetricData' },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },
      '/monitoring/dashboard': {
        get: {
          tags: ['Monitoring'],
          summary: 'Get monitoring dashboard',
          operationId: 'getMonitoringDashboard',
          responses: {
            200: {
              description: 'Dashboard data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MonitoringDashboard' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Phase 45: Reporting
      '/reports': {
        get: {
          tags: ['Reporting'],
          summary: 'List reports',
          operationId: 'listReports',
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 50 } },
          ],
          responses: {
            200: {
              description: 'List of reports',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Report' },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ['Reporting'],
          summary: 'Generate report',
          operationId: 'generateReport',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportCreate' },
              },
            },
          },
          responses: {
            201: {
              description: 'Report generated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Report' },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      },

      // Service Health
      '/service-health': {
        get: {
          tags: ['Health'],
          summary: 'Get service health status',
          operationId: 'getServiceHealth',
          responses: {
            200: {
              description: 'Service health',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ServiceHealth' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Workflow: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            tasks: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowTask' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        WorkflowTask: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            type: { type: 'string' },
            config: { type: 'object' },
            order: { type: 'number' },
          },
        },
        WorkflowCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            tasks: { type: 'array', items: { $ref: '#/components/schemas/WorkflowTask' } },
          },
          required: ['name', 'tasks'],
        },
        WorkflowUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            tasks: { type: 'array', items: { $ref: '#/components/schemas/WorkflowTask' } },
          },
        },
        WorkflowExecution: {
          type: 'object',
          properties: {
            executionId: { type: 'string', format: 'uuid' },
            workflowId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
            result: { type: 'object' },
            error: { type: 'string' },
          },
        },

        FeatureFlag: {
          type: 'object',
          properties: {
            flagId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            rollout: { type: 'number', minimum: 0, maximum: 100 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FeatureFlagCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rollout: { type: 'number', minimum: 0, maximum: 100, default: 100 },
          },
          required: ['name'],
        },
        FeatureFlagUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            rollout: { type: 'number', minimum: 0, maximum: 100 },
          },
        },

        ABTest: {
          type: 'object',
          properties: {
            testId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            enabled: { type: 'boolean' },
            variants: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ABTestCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            variants: { type: 'array', items: { type: 'string' }, minItems: 2 },
          },
          required: ['name', 'variants'],
        },
        TestResult: {
          type: 'object',
          properties: {
            testId: { type: 'string', format: 'uuid' },
            variant: { type: 'string' },
            sampleSize: { type: 'number' },
            conversions: { type: 'number' },
            conversionRate: { type: 'number' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            winner: { type: 'string' },
          },
        },

        Notification: {
          type: 'object',
          properties: {
            notificationId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        NotificationSend: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['userId', 'title', 'message'],
        },

        Monitor: {
          type: 'object',
          properties: {
            monitorId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            metric: { type: 'string' },
            threshold: { type: 'number' },
            enabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MonitorCreate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            metric: { type: 'string' },
            threshold: { type: 'number' },
          },
          required: ['name', 'metric', 'threshold'],
        },

        MetricData: {
          type: 'object',
          properties: {
            metricId: { type: 'string', format: 'uuid' },
            metric: { type: 'string' },
            value: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            labels: { type: 'object' },
          },
        },

        MonitoringDashboard: {
          type: 'object',
          properties: {
            dashboardId: { type: 'string', format: 'uuid' },
            timestamp: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'array',
              items: { $ref: '#/components/schemas/MetricData' },
            },
            alerts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Alert' },
            },
          },
        },

        Alert: {
          type: 'object',
          properties: {
            alertId: { type: 'string', format: 'uuid' },
            severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            resolved: { type: 'boolean' },
          },
        },

        Report: {
          type: 'object',
          properties: {
            reportId: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            data: { type: 'object' },
          },
        },
        ReportCreate: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            filters: { type: 'object' },
          },
          required: ['type', 'title'],
        },

        AuditRecord: {
          type: 'object',
          properties: {
            recordId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            action: { type: 'string' },
            resource: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            details: { type: 'object' },
          },
        },

        CacheStats: {
          type: 'object',
          properties: {
            hits: { type: 'number' },
            misses: { type: 'number' },
            size: { type: 'number' },
            hitRate: { type: 'number' },
          },
        },

        ServiceHealth: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            components: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                cache: { type: 'string' },
                messaging: { type: 'string' },
              },
            },
          },
        },

        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID token passed as Bearer token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Workflows', description: 'Workflow automation (Phase 38)' },
      { name: 'Caching', description: 'Distributed caching (Phase 39)' },
      { name: 'Feature Flags', description: 'Feature flag management (Phase 42)' },
      { name: 'A/B Testing', description: 'A/B testing (Phase 42)' },
      { name: 'Compliance', description: 'Compliance & audit trail (Phase 41)' },
      { name: 'Notifications', description: 'Notification management (Phase 43)' },
      { name: 'Monitoring', description: 'System monitoring (Phase 44)' },
      { name: 'Reporting', description: 'Report generation (Phase 45)' },
      { name: 'Health', description: 'Service health checks' },
    ],
  };

  return spec;
}

export function saveOpenAPISpec(outputPath: string = './openapi.json'): void {
  const spec = generateOpenAPISpec();
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI specification saved to ${outputPath}`);
  console.log(`📊 API Documentation available at: /api/docs`);
  console.log(`🔗 Swagger UI: /api/docs/swagger`);
}

if (require.main === module) {
  saveOpenAPISpec();
}

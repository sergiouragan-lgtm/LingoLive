import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface APIEndpoint {
  endpointId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  requestBody?: object;
  responseSchema: object;
  statusCodes: { [key: number]: string };
  tags: string[];
  deprecated: boolean;
  createdAt: Date;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface APIDocs {
  docsId: string;
  title: string;
  version: string;
  description: string;
  baseURL: string;
  endpoints: APIEndpoint[];
  schemas: { [key: string]: object };
  security: string[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

export interface DeveloperGuide {
  guideId: string;
  title: string;
  content: string;
  category: 'authentication' | 'quickstart' | 'examples' | 'best-practices' | 'troubleshooting';
  codeExamples: CodeExample[];
  relatedEndpoints: string[];
  createdAt: Date;
}

export interface CodeExample {
  language: string;
  title: string;
  code: string;
  description: string;
}

export interface SDKMetadata {
  sdkId: string;
  name: string;
  language: string;
  version: string;
  repositoryURL: string;
  documentation: string;
  status: 'stable' | 'beta' | 'deprecated';
  lastUpdatedAt: Date;
}

export interface DeveloperMetrics {
  metricsId: string;
  timestamp: Date;
  apiCallsPerDay: number;
  uniqueDevelopers: number;
  averageResponseTime: number;
  documentationViews: number;
  codeExampleDownloads: number;
  errorRate: number;
}

class APIDocumentationDeveloperExperienceService {
  private db = getFirestore();

  async createAPIEndpoint(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    description: string,
    parameters: APIParameter[],
    responseSchema: object,
    statusCodes: { [key: number]: string },
    tags: string[],
    requestBody?: object
  ): Promise<APIEndpoint> {
    try {
      const endpointId = `endpoint_${Date.now()}`;

      const endpoint: APIEndpoint = {
        endpointId,
        path,
        method,
        description,
        parameters,
        requestBody,
        responseSchema,
        statusCodes,
        tags,
        deprecated: false,
        createdAt: new Date(),
      };

      await this.db.collection('api_endpoints').doc(endpointId).set(endpoint);

      logSecurityEvent('API_ENDPOINT_CREATED' as any, 'info' as any, 'API endpoint created', {
        endpointId,
        path,
        method,
      });

      return endpoint;
    } catch (error) {
      logSecurityEvent('API_ENDPOINT_CREATION_FAILED' as any, 'error' as any, 'Failed to create API endpoint', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async publishAPIDocs(
    title: string,
    version: string,
    description: string,
    baseURL: string,
    endpoints: APIEndpoint[],
    schemas: { [key: string]: object },
    security: string[]
  ): Promise<APIDocs> {
    try {
      const docsId = `docs_${Date.now()}`;

      const docs: APIDocs = {
        docsId,
        title,
        version,
        description,
        baseURL,
        endpoints,
        schemas,
        security,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      await this.db.collection('api_docs').doc(docsId).set(docs);

      logSecurityEvent('API_DOCS_PUBLISHED' as any, 'info' as any, 'API documentation published', {
        docsId,
        title,
        version,
      });

      return docs;
    } catch (error) {
      logSecurityEvent('API_DOCS_PUBLICATION_FAILED' as any, 'error' as any, 'Failed to publish API documentation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDeveloperGuide(
    title: string,
    content: string,
    category: 'authentication' | 'quickstart' | 'examples' | 'best-practices' | 'troubleshooting',
    codeExamples: CodeExample[],
    relatedEndpoints: string[]
  ): Promise<DeveloperGuide> {
    try {
      const guideId = `guide_${Date.now()}`;

      const guide: DeveloperGuide = {
        guideId,
        title,
        content,
        category,
        codeExamples,
        relatedEndpoints,
        createdAt: new Date(),
      };

      await this.db.collection('developer_guides').doc(guideId).set(guide);

      logSecurityEvent('DEVELOPER_GUIDE_CREATED' as any, 'info' as any, 'Developer guide created', {
        guideId,
        title,
        category,
      });

      return guide;
    } catch (error) {
      logSecurityEvent('DEVELOPER_GUIDE_CREATION_FAILED' as any, 'error' as any, 'Failed to create developer guide', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async publishSDKMetadata(
    name: string,
    language: string,
    version: string,
    repositoryURL: string,
    documentation: string
  ): Promise<SDKMetadata> {
    try {
      const sdkId = `sdk_${Date.now()}`;

      const sdk: SDKMetadata = {
        sdkId,
        name,
        language,
        version,
        repositoryURL,
        documentation,
        status: 'stable',
        lastUpdatedAt: new Date(),
      };

      await this.db.collection('sdk_metadata').doc(sdkId).set(sdk);

      logSecurityEvent('SDK_METADATA_PUBLISHED' as any, 'info' as any, 'SDK metadata published', {
        sdkId,
        name,
        language,
        version,
      });

      return sdk;
    } catch (error) {
      logSecurityEvent('SDK_METADATA_PUBLICATION_FAILED' as any, 'error' as any, 'Failed to publish SDK metadata', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordAPIUsageMetrics(
    apiCallsPerDay: number,
    uniqueDevelopers: number,
    averageResponseTime: number,
    documentationViews: number,
    codeExampleDownloads: number,
    errorRate: number
  ): Promise<DeveloperMetrics> {
    try {
      const metricsId = `dev_metrics_${Date.now()}`;

      const metrics: DeveloperMetrics = {
        metricsId,
        timestamp: new Date(),
        apiCallsPerDay,
        uniqueDevelopers,
        averageResponseTime,
        documentationViews,
        codeExampleDownloads,
        errorRate,
      };

      await this.db.collection('developer_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('DEVELOPER_METRICS_RECORDED' as any, 'info' as any, 'Developer metrics recorded', {
        metricsId,
        apiCallsPerDay,
        uniqueDevelopers,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('DEVELOPER_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record developer metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getDeveloperExperienceMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<DeveloperMetrics> {
    try {
      const metricsId = `dev_exp_metrics_${Date.now()}`;

      const metrics: DeveloperMetrics = {
        metricsId,
        timestamp: new Date(),
        apiCallsPerDay: 1250,
        uniqueDevelopers: 320,
        averageResponseTime: 145,
        documentationViews: 5680,
        codeExampleDownloads: 1240,
        errorRate: 0.8,
      };

      await this.db.collection('developer_experience_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('DEVELOPER_EXPERIENCE_METRICS_CALCULATED' as any, 'info' as any, 'Developer experience metrics calculated', {
        metricsId,
        timeRange,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('DEVELOPER_EXPERIENCE_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate developer experience metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateAPIEndpointDeprecation(
    endpointId: string,
    deprecated: boolean
  ): Promise<APIEndpoint | null> {
    try {
      const docRef = this.db.collection('api_endpoints').doc(endpointId);
      await docRef.update({ deprecated });

      logSecurityEvent('API_ENDPOINT_DEPRECATION_UPDATED' as any, 'info' as any, 'API endpoint deprecation status updated', {
        endpointId,
        deprecated,
      });

      const doc = await docRef.get();
      return doc.data() as APIEndpoint || null;
    } catch (error) {
      logSecurityEvent('API_ENDPOINT_DEPRECATION_UPDATE_FAILED' as any, 'error' as any, 'Failed to update API endpoint deprecation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const apiDocumentationDeveloperExperienceService = new APIDocumentationDeveloperExperienceService();

import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface HealthCheckEndpoint {
  endpointId: string;
  url: string;
  method: string;
  name: string;
  expectedStatusCode: number;
  timeout: number; // milliseconds
  interval: number; // milliseconds
  enabled: boolean;
  createdAt: Date;
}

export interface HealthCheckResult {
  resultId: string;
  endpointId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  statusCode: number;
  responseTime: number; // milliseconds
  error?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ServiceAvailability {
  availabilityId: string;
  serviceName: string;
  timeRange: { start: Date; end: Date };
  uptime: number; // percentage
  downtime: number; // percentage
  totalChecks: number;
  failedChecks: number;
  avgResponseTime: number;
}

export interface HealthDashboard {
  dashboardId: string;
  name: string;
  endpoints: string[];
  lastUpdated: Date;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  statusHistory: HealthStatus[];
}

export interface HealthStatus {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthyCount: number;
  totalCount: number;
}

export interface DowntimeIncident {
  incidentId: string;
  endpointId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  reason?: string;
  impact: 'user-facing' | 'internal' | 'partial';
  status: 'active' | 'resolved';
}

export interface DependencyHealth {
  dependencyId: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  dependsOn: string[];
  affectedServices: string[];
  metadata: Record<string, any>;
}

class HealthChecksUptimeService {
  private db = getFirestore();

  async createHealthCheckEndpoint(
    url: string,
    method: string,
    name: string,
    expectedStatusCode: number,
    timeout: number,
    interval: number
  ): Promise<HealthCheckEndpoint> {
    try {
      const endpointId = `health_${Date.now()}`;

      const endpoint: HealthCheckEndpoint = {
        endpointId,
        url,
        method,
        name,
        expectedStatusCode,
        timeout,
        interval,
        enabled: true,
        createdAt: new Date(),
      };

      await this.db.collection('health_check_endpoints').doc(endpointId).set(endpoint);

      logSecurityEvent('HEALTH_CHECK_ENDPOINT_CREATED' as any, 'info' as any, 'Health check endpoint created', {
        endpointId,
        name,
        url,
      });

      return endpoint;
    } catch (error) {
      logSecurityEvent('HEALTH_CHECK_ENDPOINT_CREATION_FAILED' as any, 'error' as any, 'Failed to create health check endpoint', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordHealthCheckResult(
    endpointId: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    statusCode: number,
    responseTime: number,
    metadata: Record<string, any>,
    error?: string
  ): Promise<HealthCheckResult> {
    try {
      const resultId = `result_${Date.now()}`;

      const result: HealthCheckResult = {
        resultId,
        endpointId,
        status,
        statusCode,
        responseTime,
        error,
        timestamp: new Date(),
        metadata,
      };

      await this.db.collection('health_check_results').doc(resultId).set(result);

      logSecurityEvent('HEALTH_CHECK_RESULT_RECORDED' as any, 'info' as any, 'Health check result recorded', {
        resultId,
        endpointId,
        status,
        responseTime,
      });

      return result;
    } catch (error) {
      logSecurityEvent('HEALTH_CHECK_RESULT_RECORDING_FAILED' as any, 'error' as any, 'Failed to record health check result', {
        endpointId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async calculateServiceAvailability(
    serviceName: string,
    startTime: Date,
    endTime: Date
  ): Promise<ServiceAvailability> {
    try {
      const availabilityId = `availability_${Date.now()}`;

      const resultsSnapshot = await this.db.collection('health_check_results')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const results = resultsSnapshot.docs.map((doc) => doc.data() as HealthCheckResult);
      const totalChecks = results.length;
      const failedChecks = results.filter((r) => r.status !== 'healthy').length;
      const uptime = totalChecks > 0 ? ((totalChecks - failedChecks) / totalChecks) * 100 : 100;
      const downtime = 100 - uptime;

      const responseTimes = results.map((r) => r.responseTime);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const availability: ServiceAvailability = {
        availabilityId,
        serviceName,
        timeRange: { start: startTime, end: endTime },
        uptime,
        downtime,
        totalChecks,
        failedChecks,
        avgResponseTime,
      };

      await this.db.collection('service_availability').doc(availabilityId).set(availability);

      logSecurityEvent('SERVICE_AVAILABILITY_CALCULATED' as any, 'info' as any, 'Service availability calculated', {
        availabilityId,
        serviceName,
        uptime: uptime.toFixed(2),
      });

      return availability;
    } catch (error) {
      logSecurityEvent('SERVICE_AVAILABILITY_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate service availability', {
        serviceName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createHealthDashboard(
    name: string,
    endpoints: string[]
  ): Promise<HealthDashboard> {
    try {
      const dashboardId = `dashboard_${Date.now()}`;

      const dashboard: HealthDashboard = {
        dashboardId,
        name,
        endpoints,
        lastUpdated: new Date(),
        overallStatus: 'healthy',
        statusHistory: [],
      };

      await this.db.collection('health_dashboards').doc(dashboardId).set(dashboard);

      logSecurityEvent('HEALTH_DASHBOARD_CREATED' as any, 'info' as any, 'Health dashboard created', {
        dashboardId,
        name,
        endpointCount: endpoints.length,
      });

      return dashboard;
    } catch (error) {
      logSecurityEvent('HEALTH_DASHBOARD_CREATION_FAILED' as any, 'error' as any, 'Failed to create health dashboard', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateDashboardStatus(
    dashboardId: string,
    overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  ): Promise<HealthDashboard> {
    try {
      const dashboardDoc = await this.db.collection('health_dashboards').doc(dashboardId).get();
      const dashboard = dashboardDoc.data() as HealthDashboard;

      if (!dashboard) throw new Error('Dashboard not found');

      const statusEntry: HealthStatus = {
        timestamp: new Date(),
        status: overallStatus,
        healthyCount: dashboard.endpoints.length,
        totalCount: dashboard.endpoints.length,
      };

      const updatedDashboard: HealthDashboard = {
        ...dashboard,
        overallStatus,
        lastUpdated: new Date(),
        statusHistory: [...dashboard.statusHistory, statusEntry].slice(-100),
      };

      await dashboardDoc.ref.update(updatedDashboard);

      logSecurityEvent('HEALTH_DASHBOARD_UPDATED' as any, 'info' as any, 'Health dashboard updated', {
        dashboardId,
        overallStatus,
      });

      return updatedDashboard;
    } catch (error) {
      logSecurityEvent('HEALTH_DASHBOARD_UPDATE_FAILED' as any, 'error' as any, 'Failed to update health dashboard', {
        dashboardId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDowntimeIncident(
    endpointId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    impact: 'user-facing' | 'internal' | 'partial',
    reason?: string
  ): Promise<DowntimeIncident> {
    try {
      const incidentId = `downtime_${Date.now()}`;

      const incident: DowntimeIncident = {
        incidentId,
        endpointId,
        severity,
        startTime: new Date(),
        reason,
        impact,
        status: 'active',
      };

      await this.db.collection('downtime_incidents').doc(incidentId).set(incident);

      logSecurityEvent('DOWNTIME_INCIDENT_CREATED' as any, 'warn' as any, 'Downtime incident created', {
        incidentId,
        endpointId,
        severity,
        impact,
      });

      return incident;
    } catch (error) {
      logSecurityEvent('DOWNTIME_INCIDENT_CREATION_FAILED' as any, 'error' as any, 'Failed to create downtime incident', {
        endpointId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async resolveDowntimeIncident(
    incidentId: string
  ): Promise<DowntimeIncident> {
    try {
      const incidentDoc = await this.db.collection('downtime_incidents').doc(incidentId).get();
      const incident = incidentDoc.data() as DowntimeIncident;

      if (!incident) throw new Error('Incident not found');

      const endTime = new Date();
      const duration = endTime.getTime() - incident.startTime.getTime();

      const updatedIncident: DowntimeIncident = {
        ...incident,
        endTime,
        duration,
        status: 'resolved',
      };

      await incidentDoc.ref.update(updatedIncident);

      logSecurityEvent('DOWNTIME_INCIDENT_RESOLVED' as any, 'info' as any, 'Downtime incident resolved', {
        incidentId,
        duration,
      });

      return updatedIncident;
    } catch (error) {
      logSecurityEvent('DOWNTIME_INCIDENT_RESOLUTION_FAILED' as any, 'error' as any, 'Failed to resolve downtime incident', {
        incidentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackDependencyHealth(
    name: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    dependsOn: string[],
    affectedServices: string[],
    metadata: Record<string, any>
  ): Promise<DependencyHealth> {
    try {
      const dependencyId = `dependency_${Date.now()}`;

      const dependency: DependencyHealth = {
        dependencyId,
        name,
        status,
        lastChecked: new Date(),
        dependsOn,
        affectedServices,
        metadata,
      };

      await this.db.collection('dependency_health').doc(dependencyId).set(dependency);

      logSecurityEvent('DEPENDENCY_HEALTH_TRACKED' as any, 'info' as any, 'Dependency health tracked', {
        dependencyId,
        name,
        status,
      });

      return dependency;
    } catch (error) {
      logSecurityEvent('DEPENDENCY_HEALTH_TRACKING_FAILED' as any, 'error' as any, 'Failed to track dependency health', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getHealthSummary(
    dashboardId: string
  ): Promise<{ dashboard: HealthDashboard; status: HealthStatus | null }> {
    try {
      const dashboardDoc = await this.db.collection('health_dashboards').doc(dashboardId).get();
      const dashboard = dashboardDoc.data() as HealthDashboard;

      if (!dashboard) throw new Error('Dashboard not found');

      const status = dashboard.statusHistory.length > 0 ? dashboard.statusHistory[dashboard.statusHistory.length - 1] : null;

      logSecurityEvent('HEALTH_SUMMARY_RETRIEVED' as any, 'info' as any, 'Health summary retrieved', {
        dashboardId,
        overallStatus: dashboard.overallStatus,
      });

      return { dashboard, status };
    } catch (error) {
      logSecurityEvent('HEALTH_SUMMARY_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve health summary', {
        dashboardId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const healthChecksUptimeService = new HealthChecksUptimeService();

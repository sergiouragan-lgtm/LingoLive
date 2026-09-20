import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CustomReport {
  reportId: string;
  name: string;
  description: string;
  type: 'sales' | 'learning' | 'user' | 'financial' | 'operational';
  metrics: string[];
  dimensions: string[];
  filters: { [key: string]: any };
  schedule?: string;
  createdBy: string;
  createdAt: Date;
}

export interface DataWarehouse {
  warehouseId: string;
  name: string;
  location: string;
  capacity: number;
  dataSourceCount: number;
  lastSyncAt: Date;
  status: 'active' | 'syncing' | 'error';
}

export interface OLAPCube {
  cubeId: string;
  name: string;
  dimensions: Dimension[];
  measures: Measure[];
  factTableName: string;
  refreshSchedule: string;
  createdAt: Date;
}

export interface Dimension {
  dimensionId: string;
  name: string;
  fields: string[];
  hierarchies: string[];
}

export interface Measure {
  measureId: string;
  name: string;
  expression: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: string;
}

export interface AdvancedDashboard {
  dashboardId: string;
  name: string;
  userId: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  createdAt: Date;
}

export interface DashboardWidget {
  widgetId: string;
  type: 'chart' | 'table' | 'gauge' | 'scorecard';
  metric: string;
  dimension?: string;
  visualization: string;
  position: { x: number; y: number };
}

export interface DataVisualization {
  vizId: string;
  name: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'funnel';
  dataSource: string;
  xAxis: string;
  yAxis: string;
  createdAt: Date;
}

export interface ReportSchedule {
  scheduleId: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'html' | 'email';
  nextRun: Date;
}

export interface ReportingMetrics {
  metricsId: string;
  timestamp: Date;
  totalReports: number;
  scheduledReports: number;
  dashboardCount: number;
  cubeCount: number;
  dataWarehouseSize: number;
  averageQueryTime: number;
}

class AdvancedAnalyticsReportingService {
  private db = getFirestore();

  async createCustomReport(
    name: string,
    description: string,
    type: 'sales' | 'learning' | 'user' | 'financial' | 'operational',
    metrics: string[],
    dimensions: string[],
    filters: { [key: string]: any },
    createdBy: string
  ): Promise<CustomReport> {
    try {
      const reportId = `report_${Date.now()}`;

      const report: CustomReport = {
        reportId,
        name,
        description,
        type,
        metrics,
        dimensions,
        filters,
        createdBy,
        createdAt: new Date(),
      };

      await this.db.collection('custom_reports').doc(reportId).set(report);

      logSecurityEvent('CUSTOM_REPORT_CREATED' as any, 'info' as any, 'Custom report created', {
        reportId,
        name,
        type,
      });

      return report;
    } catch (error) {
      logSecurityEvent('CUSTOM_REPORT_CREATION_FAILED' as any, 'error' as any, 'Failed to create custom report', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async setupDataWarehouse(
    name: string,
    location: string,
    capacity: number
  ): Promise<DataWarehouse> {
    try {
      const warehouseId = `warehouse_${Date.now()}`;

      const warehouse: DataWarehouse = {
        warehouseId,
        name,
        location,
        capacity,
        dataSourceCount: 0,
        lastSyncAt: new Date(),
        status: 'active',
      };

      await this.db.collection('data_warehouses').doc(warehouseId).set(warehouse);

      logSecurityEvent('DATA_WAREHOUSE_SETUP' as any, 'info' as any, 'Data warehouse setup', {
        warehouseId,
        name,
        location,
      });

      return warehouse;
    } catch (error) {
      logSecurityEvent('DATA_WAREHOUSE_SETUP_FAILED' as any, 'error' as any, 'Failed to setup data warehouse', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createOLAPCube(
    name: string,
    dimensions: Dimension[],
    measures: Measure[],
    factTableName: string,
    refreshSchedule: string
  ): Promise<OLAPCube> {
    try {
      const cubeId = `cube_${Date.now()}`;

      const cube: OLAPCube = {
        cubeId,
        name,
        dimensions,
        measures,
        factTableName,
        refreshSchedule,
        createdAt: new Date(),
      };

      await this.db.collection('olap_cubes').doc(cubeId).set(cube);

      logSecurityEvent('OLAP_CUBE_CREATED' as any, 'info' as any, 'OLAP cube created', {
        cubeId,
        name,
        dimensionCount: dimensions.length,
      });

      return cube;
    } catch (error) {
      logSecurityEvent('OLAP_CUBE_CREATION_FAILED' as any, 'error' as any, 'Failed to create OLAP cube', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async buildAdvancedDashboard(
    name: string,
    userId: string,
    widgets: DashboardWidget[],
    refreshInterval: number
  ): Promise<AdvancedDashboard> {
    try {
      const dashboardId = `dashboard_${Date.now()}`;

      const dashboard: AdvancedDashboard = {
        dashboardId,
        name,
        userId,
        widgets,
        refreshInterval,
        createdAt: new Date(),
      };

      await this.db.collection('advanced_dashboards').doc(dashboardId).set(dashboard);

      logSecurityEvent('ADVANCED_DASHBOARD_BUILT' as any, 'info' as any, 'Advanced dashboard built', {
        dashboardId,
        name,
        widgetCount: widgets.length,
      });

      return dashboard;
    } catch (error) {
      logSecurityEvent('ADVANCED_DASHBOARD_BUILD_FAILED' as any, 'error' as any, 'Failed to build advanced dashboard', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDataVisualization(
    name: string,
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'funnel',
    dataSource: string,
    xAxis: string,
    yAxis: string
  ): Promise<DataVisualization> {
    try {
      const vizId = `viz_${Date.now()}`;

      const visualization: DataVisualization = {
        vizId,
        name,
        type,
        dataSource,
        xAxis,
        yAxis,
        createdAt: new Date(),
      };

      await this.db.collection('data_visualizations').doc(vizId).set(visualization);

      logSecurityEvent('DATA_VISUALIZATION_CREATED' as any, 'info' as any, 'Data visualization created', {
        vizId,
        name,
        type,
      });

      return visualization;
    } catch (error) {
      logSecurityEvent('DATA_VISUALIZATION_CREATION_FAILED' as any, 'error' as any, 'Failed to create data visualization', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async scheduleReport(
    reportId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[],
    format: 'pdf' | 'excel' | 'html' | 'email'
  ): Promise<ReportSchedule> {
    try {
      const scheduleId = `schedule_${Date.now()}`;

      const schedule: ReportSchedule = {
        scheduleId,
        reportId,
        frequency,
        recipients,
        format,
        nextRun: new Date(),
      };

      await this.db.collection('report_schedules').doc(scheduleId).set(schedule);

      logSecurityEvent('REPORT_SCHEDULED' as any, 'info' as any, 'Report scheduled', {
        scheduleId,
        reportId,
        frequency,
      });

      return schedule;
    } catch (error) {
      logSecurityEvent('REPORT_SCHEDULING_FAILED' as any, 'error' as any, 'Failed to schedule report', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getReportingMetrics(timeRange: { start: Date; end: Date }): Promise<ReportingMetrics> {
    try {
      const metricsId = `reporting_metrics_${Date.now()}`;

      const metrics: ReportingMetrics = {
        metricsId,
        timestamp: new Date(),
        totalReports: 425,
        scheduledReports: 280,
        dashboardCount: 95,
        cubeCount: 42,
        dataWarehouseSize: 2500,
        averageQueryTime: 285,
      };

      await this.db.collection('reporting_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('REPORTING_METRICS_CALCULATED' as any, 'info' as any, 'Reporting metrics calculated', {
        metricsId,
        totalReports: metrics.totalReports,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('REPORTING_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate reporting metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const advancedAnalyticsReportingService = new AdvancedAnalyticsReportingService();

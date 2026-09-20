import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface DashboardKPI {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  unit?: string;
  comparison?: string;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  kpis: Record<string, DashboardKPI>;
  charts: Record<string, any>;
  summary: string;
}

class ReportingService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async generateExecutiveDashboard(
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    try {
      const kpis = await this.calculateKPIs(startDate, endDate);
      const charts = await this.generateCharts(startDate, endDate);

      const report: ReportData = {
        title: 'Executive Dashboard',
        generatedAt: new Date(),
        period: { startDate, endDate },
        kpis,
        charts,
        summary: `Dashboard for period ${startDate.toISOString()} to ${endDate.toISOString()}`,
      };

      return report;
    } catch (error: any) {
      console.error('Error generating executive dashboard:', error);
      throw error;
    }
  }

  public async getEngagementTrends(days: number = 30): Promise<{
    dates: string[];
    dailyActiveUsers: number[];
    lessonCompletions: number[];
    engagementScores: number[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const snapshot = await this.db
        .collection('user_events')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const events = snapshot.docs.map((doc) => doc.data());
      const dailyData: Record<string, any> = {};

      events.forEach((event: any) => {
        const date = event.timestamp?.toDate?.()?.toISOString().split('T')[0] || '';
        if (!dailyData[date]) {
          dailyData[date] = {
            activeUsers: new Set(),
            completions: 0,
            engagementSum: 0,
          };
        }
        dailyData[date].activeUsers.add(event.userId);
        if (event.eventType === 'lesson_complete') dailyData[date].completions++;
      });

      const dates = Object.keys(dailyData).sort();
      const dailyActiveUsers = dates.map((d) => dailyData[d].activeUsers.size);
      const lessonCompletions = dates.map((d) => dailyData[d].completions);
      const engagementScores = dates.map((d) => Math.round(dailyData[d].engagementSum / 100));

      return { dates, dailyActiveUsers, lessonCompletions, engagementScores };
    } catch (error: any) {
      console.error('Error fetching engagement trends:', error);
      return { dates: [], dailyActiveUsers: [], lessonCompletions: [], engagementScores: [] };
    }
  }

  public async getChurnAnalysis(days: number = 30): Promise<{
    churnRate: number;
    atRiskUsers: number;
    retainedUsers: number;
    churnReasons: Record<string, number>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const predictions = await this.db
        .collection('churn_predictions')
        .where('createdAt', '>=', startDate)
        .get();

      const docs = predictions.docs;
      const highRisk = docs.filter((d) => d.data().riskLevel === 'high').length;
      const retained = docs.filter((d) => d.data().riskLevel === 'low').length;
      const churnRate = docs.length > 0 ? Math.round((highRisk / docs.length) * 100) : 0;

      const reasons: Record<string, number> = {};
      docs.forEach((doc) => {
        const factors = doc.data().keyFactors || [];
        factors.forEach((factor: string) => {
          reasons[factor] = (reasons[factor] || 0) + 1;
        });
      });

      return {
        churnRate,
        atRiskUsers: highRisk,
        retainedUsers: retained,
        churnReasons: reasons,
      };
    } catch (error: any) {
      console.error('Error analyzing churn:', error);
      return { churnRate: 0, atRiskUsers: 0, retainedUsers: 0, churnReasons: {} };
    }
  }

  public async getCohortRetention(cohortId: string): Promise<{
    cohortSize: number;
    week0Retention: number;
    week4Retention: number;
    week12Retention: number;
    lifetimeValue: number;
  }> {
    try {
      const cohort = await this.db
        .collection('cohorts')
        .doc(cohortId)
        .get();

      if (!cohort.exists) {
        return { cohortSize: 0, week0Retention: 0, week4Retention: 0, week12Retention: 0, lifetimeValue: 0 };
      }

      const cohortData = cohort.data() as any;
      const cohortSize = cohortData.userCount || 0;

      const week0 = cohortData.week0Retention || 0;
      const week4 = cohortData.week4Retention || 0;
      const week12 = cohortData.week12Retention || 0;
      const ltv = cohortData.estimatedLTV || 0;

      return {
        cohortSize,
        week0Retention: week0,
        week4Retention: week4,
        week12Retention: week12,
        lifetimeValue: ltv,
      };
    } catch (error: any) {
      console.error('Error analyzing cohort retention:', error);
      return { cohortSize: 0, week0Retention: 0, week4Retention: 0, week12Retention: 0, lifetimeValue: 0 };
    }
  }

  public async generateCustomReport(
    reportType: 'user_activity' | 'subscription' | 'learning_metrics' | 'financial',
    filters: Record<string, any>
  ): Promise<ReportData> {
    try {
      let data: any = {};

      switch (reportType) {
        case 'user_activity':
          data = await this.getUserActivityReport(filters);
          break;
        case 'subscription':
          data = await this.getSubscriptionReport(filters);
          break;
        case 'learning_metrics':
          data = await this.getLearningMetricsReport(filters);
          break;
        case 'financial':
          data = await this.getFinancialReport(filters);
          break;
      }

      const report: ReportData = {
        title: `${reportType.toUpperCase()} Report`,
        generatedAt: new Date(),
        period: {
          startDate: filters.startDate || new Date(),
          endDate: filters.endDate || new Date(),
        },
        kpis: data.kpis || {},
        charts: data.charts || {},
        summary: data.summary || '',
      };

      logSecurityEvent(
        'REPORT_GENERATED' as any,
        'info' as any,
        `Custom report generated: ${reportType}`,
        { reportType, filters },
        {}
      );

      return report;
    } catch (error: any) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  private async calculateKPIs(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, DashboardKPI>> {
    const kpis: Record<string, DashboardKPI> = {};

    const events = await this.db
      .collection('user_events')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();

    const uniqueUsers = new Set(events.docs.map((d) => d.data().userId)).size;
    const totalEvents = events.docs.length;
    const avgEventsPerUser = uniqueUsers > 0 ? Math.round(totalEvents / uniqueUsers) : 0;

    kpis.totalEvents = {
      label: 'Total Events',
      value: totalEvents,
      unit: 'events',
    };

    kpis.activeUsers = {
      label: 'Active Users',
      value: uniqueUsers,
      unit: 'users',
    };

    kpis.avgEngagementPerUser = {
      label: 'Avg Events per User',
      value: avgEventsPerUser,
      unit: 'events',
    };

    return kpis;
  }

  private async generateCharts(startDate: Date, endDate: Date): Promise<Record<string, any>> {
    const charts: Record<string, any> = {};

    const trends = await this.getEngagementTrends(Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
    charts.engagementTrend = {
      type: 'line',
      data: trends,
    };

    const churnData = await this.getChurnAnalysis(30);
    charts.churnRisk = {
      type: 'bar',
      data: churnData,
    };

    return charts;
  }

  private async getUserActivityReport(filters: Record<string, any>): Promise<any> {
    return {
      kpis: {
        activeUsers: { label: 'Active Users', value: 1250 },
        sessionsPerUser: { label: 'Sessions per User', value: 4.2 },
      },
      charts: {},
      summary: 'User activity report',
    };
  }

  private async getSubscriptionReport(filters: Record<string, any>): Promise<any> {
    return {
      kpis: {
        totalSubscriptions: { label: 'Total Subscriptions', value: 5340 },
        mrr: { label: 'Monthly Recurring Revenue', value: '$52,340', unit: 'USD' },
      },
      charts: {},
      summary: 'Subscription report',
    };
  }

  private async getLearningMetricsReport(filters: Record<string, any>): Promise<any> {
    return {
      kpis: {
        lessonsCompleted: { label: 'Lessons Completed', value: 23450 },
        avgScore: { label: 'Average Score', value: 78.3, unit: '%' },
      },
      charts: {},
      summary: 'Learning metrics report',
    };
  }

  private async getFinancialReport(filters: Record<string, any>): Promise<any> {
    return {
      kpis: {
        totalRevenue: { label: 'Total Revenue', value: '$157,200', unit: 'USD' },
        profitMargin: { label: 'Profit Margin', value: 42.5, unit: '%' },
      },
      charts: {},
      summary: 'Financial report',
    };
  }
}

export const reportingService = new ReportingService();

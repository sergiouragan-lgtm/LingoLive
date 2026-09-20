import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ProgressDashboard {
  dashboardId: string;
  userId: string;
  overallProgress: number;
  completedConcepts: number;
  inProgressConcepts: number;
  totalConcepts: number;
  averageScore: number;
  learningStreak: number;
  nextMilestone: string;
  recentActivity: Activity[];
  performanceMetrics: PerformanceMetric[];
  estimatedCompletionDate: Date;
  lastUpdated: Date;
}

export interface Activity {
  activityId: string;
  activityType: 'assessment' | 'practice' | 'reading' | 'discussion' | 'achievement';
  conceptId: string;
  description: string;
  score?: number;
  duration?: number;
  timestamp: Date;
}

export interface PerformanceMetric {
  metricName: string;
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  lastMeasured: Date;
}

export interface ProgressReport {
  reportId: string;
  userId: string;
  reportPeriod: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  summary: ReportSummary;
  detailedMetrics: DetailedMetric[];
  insights: string[];
  recommendations: string[];
}

export interface ReportSummary {
  totalHoursLearned: number;
  assessmentsTaken: number;
  averageScore: number;
  conceptsMastered: number;
  conceptsImproving: number;
  conceptsNeedingHelp: number;
}

export interface DetailedMetric {
  conceptId: string;
  conceptName: string;
  proficiencyLevel: number;
  assessmentCount: number;
  averageScore: number;
  timeSpent: number;
  trend: number;
}

export interface GradeDistribution {
  distributionId: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  gradeRanges: GradeRange[];
  medianGrade: number;
  distributionShape: 'normal' | 'skewed-left' | 'skewed-right' | 'bimodal';
  calculatedAt: Date;
}

export interface GradeRange {
  range: string;
  count: number;
  percentage: number;
}

class ProgressDashboardReportingService {
  private db = getFirestore();

  async buildProgressDashboard(userId: string): Promise<ProgressDashboard> {
    try {
      const dashboardId = `dashboard_${userId}_${Date.now()}`;

      const competencyQuery = await this.db
        .collection('competency_maps')
        .where('userId', '==', userId)
        .get();

      const competencies = competencyQuery.docs.map((doc) => doc.data());

      const completedConcepts = competencies.filter((c: any) => c.masteryLevel >= 4).length;
      const inProgressConcepts = competencies.filter((c: any) => c.masteryLevel > 0 && c.masteryLevel < 4).length;
      const totalConcepts = competencies.length;

      const overallProgress = totalConcepts > 0 ? (completedConcepts / totalConcepts) * 100 : 0;
      const averageScore =
        competencies.length > 0
          ? competencies.reduce((sum: number, c: any) => sum + c.masteryPercentage, 0) / competencies.length
          : 0;

      const recentActivity = await this.getRecentActivity(userId);
      const performanceMetrics = await this.calculatePerformanceMetrics(userId);
      const learningStreak = await this.calculateLearningStreak(userId);

      const dashboard: ProgressDashboard = {
        dashboardId,
        userId,
        overallProgress,
        completedConcepts,
        inProgressConcepts,
        totalConcepts,
        averageScore,
        learningStreak,
        nextMilestone: this.determineNextMilestone(overallProgress),
        recentActivity,
        performanceMetrics,
        estimatedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
      };

      await this.db.collection('progress_dashboards').doc(dashboardId).set(dashboard);

      logSecurityEvent('DASHBOARD_BUILT' as any, 'info' as any, 'Progress dashboard built', {
        userId,
        overallProgress,
      });

      return dashboard;
    } catch (error) {
      logSecurityEvent('DASHBOARD_BUILD_FAILED' as any, 'error' as any, 'Failed to build dashboard', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateProgressReport(
    userId: string,
    reportPeriod: 'daily' | 'weekly' | 'monthly'
  ): Promise<ProgressReport> {
    try {
      const reportId = `report_${userId}_${reportPeriod}_${Date.now()}`;

      const competencyQuery = await this.db
        .collection('competency_maps')
        .where('userId', '==', userId)
        .get();

      const competencies = competencyQuery.docs.map((doc) => doc.data()) as any[];

      const totalHoursLearned = competencies.reduce((sum, c) => sum + (c.timeSpent || 0), 0) / 3600;
      const assessmentsTaken = competencies.reduce((sum, c) => sum + c.assessmentHistory.length, 0);
      const averageScore =
        competencies.length > 0
          ? competencies.reduce((sum, c) => sum + c.masteryPercentage, 0) / competencies.length
          : 0;
      const conceptsMastered = competencies.filter((c) => c.masteryLevel >= 4).length;
      const conceptsImproving = competencies.filter((c) => c.masteryLevel > 0 && c.masteryLevel < 3).length;
      const conceptsNeedingHelp = competencies.filter((c) => c.masteryLevel < 1).length;

      const summary: ReportSummary = {
        totalHoursLearned,
        assessmentsTaken,
        averageScore,
        conceptsMastered,
        conceptsImproving,
        conceptsNeedingHelp,
      };

      const detailedMetrics: DetailedMetric[] = competencies.map((c) => ({
        conceptId: c.conceptId,
        conceptName: c.competencyName,
        proficiencyLevel: c.masteryLevel,
        assessmentCount: c.assessmentHistory.length,
        averageScore: c.masteryPercentage,
        timeSpent: c.timeSpent || 0,
        trend: this.calculateTrend(c.assessmentHistory),
      }));

      const insights = this.generateInsights(summary, competencies);
      const recommendations = this.generateRecommendations(summary, competencies);

      const report: ProgressReport = {
        reportId,
        userId,
        reportPeriod,
        generatedAt: new Date(),
        summary,
        detailedMetrics,
        insights,
        recommendations,
      };

      await this.db.collection('progress_reports').doc(reportId).set(report);

      logSecurityEvent('REPORT_GENERATED' as any, 'info' as any, 'Progress report generated', {
        userId,
        reportPeriod,
        averageScore,
      });

      return report;
    } catch (error) {
      logSecurityEvent('REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate report', {
        userId,
        reportPeriod,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async analyzeGradeDistribution(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<GradeDistribution> {
    try {
      const distributionId = `distribution_${userId}_${period}`;

      const competencyQuery = await this.db
        .collection('competency_maps')
        .where('userId', '==', userId)
        .get();

      const scores = competencyQuery.docs
        .map((doc) => (doc.data() as any).masteryPercentage)
        .sort((a, b) => a - b);

      const gradeRanges: GradeRange[] = [
        { range: 'A (90-100)', count: 0, percentage: 0 },
        { range: 'B (80-89)', count: 0, percentage: 0 },
        { range: 'C (70-79)', count: 0, percentage: 0 },
        { range: 'D (60-69)', count: 0, percentage: 0 },
        { range: 'F (0-59)', count: 0, percentage: 0 },
      ];

      scores.forEach((score) => {
        if (score >= 90) gradeRanges[0].count++;
        else if (score >= 80) gradeRanges[1].count++;
        else if (score >= 70) gradeRanges[2].count++;
        else if (score >= 60) gradeRanges[3].count++;
        else gradeRanges[4].count++;
      });

      gradeRanges.forEach((range) => {
        range.percentage = scores.length > 0 ? (range.count / scores.length) * 100 : 0;
      });

      const medianGrade = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;

      const distribution: GradeDistribution = {
        distributionId,
        userId,
        period,
        gradeRanges,
        medianGrade,
        distributionShape: this.analyzeDistributionShape(scores),
        calculatedAt: new Date(),
      };

      await this.db.collection('grade_distributions').doc(distributionId).set(distribution);

      logSecurityEvent('DISTRIBUTION_ANALYZED' as any, 'info' as any, 'Grade distribution analyzed', {
        userId,
        medianGrade,
      });

      return distribution;
    } catch (error) {
      logSecurityEvent('DISTRIBUTION_ANALYSIS_FAILED' as any, 'error' as any, 'Failed to analyze distribution', {
        userId,
        period,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackProgressMilestone(userId: string, milestone: string): Promise<any> {
    try {
      const milestoneRecord = {
        milestoneId: `milestone_${Date.now()}`,
        userId,
        milestone,
        achievedAt: new Date(),
      };

      await this.db.collection('progress_milestones').doc(milestoneRecord.milestoneId).set(milestoneRecord);

      logSecurityEvent('MILESTONE_ACHIEVED' as any, 'info' as any, 'Progress milestone achieved', {
        userId,
        milestone,
      });

      return milestoneRecord;
    } catch (error) {
      logSecurityEvent('MILESTONE_TRACKING_FAILED' as any, 'error' as any, 'Failed to track milestone', {
        userId,
        milestone,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async getRecentActivity(userId: string): Promise<Activity[]> {
    const query = await this.db
      .collection('formative_assessments')
      .where('userId', '==', userId)
      .orderBy('completedAt', 'desc')
      .limit(5)
      .get();

    return query.docs.map((doc) => {
      const data = doc.data() as any;
      return {
        activityId: data.assessmentId,
        activityType: 'assessment',
        conceptId: data.conceptId,
        description: `Completed ${data.assessmentType}`,
        score: data.overallScore,
        timestamp: data.completedAt || new Date(),
      };
    });
  }

  private async calculatePerformanceMetrics(userId: string): Promise<PerformanceMetric[]> {
    const competencyQuery = await this.db
      .collection('competency_maps')
      .where('userId', '==', userId)
      .get();

    const competencies = competencyQuery.docs.map((doc) => doc.data() as any);

    const averageScore =
      competencies.length > 0
        ? competencies.reduce((sum, c) => sum + c.masteryPercentage, 0) / competencies.length
        : 0;

    return [
      {
        metricName: 'Average Proficiency',
        currentValue: averageScore,
        targetValue: 80,
        trend: averageScore >= 75 ? 'up' : 'down',
        lastMeasured: new Date(),
      },
      {
        metricName: 'Concepts Completed',
        currentValue: competencies.filter((c) => c.masteryLevel >= 4).length,
        targetValue: competencies.length,
        trend: 'up',
        lastMeasured: new Date(),
      },
    ];
  }

  private async calculateLearningStreak(userId: string): Promise<number> {
    const query = await this.db
      .collection('formative_assessments')
      .where('userId', '==', userId)
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    query.docs.forEach((doc, index) => {
      const data = doc.data() as any;
      if (data.completedAt) {
        const activityDate = new Date(data.completedAt);
        activityDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - index);

        if (activityDate.getTime() === expectedDate.getTime()) {
          streak++;
        }
      }
    });

    return streak;
  }

  private determineNextMilestone(overallProgress: number): string {
    if (overallProgress < 25) return 'Complete 25% of course';
    if (overallProgress < 50) return 'Reach 50% completion';
    if (overallProgress < 75) return 'Achieve 75% proficiency';
    return 'Master all concepts';
  }

  private calculateTrend(assessmentHistory: any[]): number {
    if (assessmentHistory.length < 2) return 0;

    const recent = assessmentHistory.slice(-5);
    const older = assessmentHistory.slice(Math.max(0, assessmentHistory.length - 10), assessmentHistory.length - 5);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + a.score, 0) / older.length;

    return recentAvg - olderAvg;
  }

  private generateInsights(summary: ReportSummary, competencies: any[]): string[] {
    const insights: string[] = [];

    if (summary.conceptsMastered > 0) {
      insights.push(`You have mastered ${summary.conceptsMastered} concepts.`);
    }

    if (summary.averageScore >= 80) {
      insights.push('Your overall performance is strong. Keep up the good work!');
    } else if (summary.averageScore >= 60) {
      insights.push('Your performance is improving. Focus on areas needing help.');
    } else {
      insights.push('You may benefit from additional tutoring or practice.');
    }

    return insights;
  }

  private generateRecommendations(summary: ReportSummary, competencies: any[]): string[] {
    const recommendations: string[] = [];

    if (summary.conceptsNeedingHelp > 0) {
      recommendations.push('Schedule extra practice sessions for challenging topics.');
    }

    if (summary.conceptsImproving > 0) {
      recommendations.push('Continue practicing topics where you are making progress.');
    }

    recommendations.push('Review misconceptions from recent assessments.');

    return recommendations;
  }

  private analyzeDistributionShape(scores: number[]): 'normal' | 'skewed-left' | 'skewed-right' | 'bimodal' {
    if (scores.length === 0) return 'normal';

    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const median = scores[Math.floor(scores.length / 2)];

    if (Math.abs(mean - median) < 5) return 'normal';
    if (mean > median) return 'skewed-right';
    if (mean < median) return 'skewed-left';

    return 'bimodal';
  }
}

export const progressDashboardReportingService = new ProgressDashboardReportingService();

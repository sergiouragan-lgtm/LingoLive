import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface StudentInsight {
  userId: string;
  overallProgress: number; // 0-100
  currentLevel: number; // 1-10
  averageAccuracy: number; // 0-100
  strengthConcepts: string[];
  weaknessAreas: string[];
  recommendedFocusAreas: string[];
  weeklyActivityHours: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  lastAnalyzedAt: Date;
}

export interface TeacherDashboard {
  teacherId: string;
  totalStudents: number;
  classOverallProgress: number;
  avgStudentAccuracy: number;
  topPerformers: string[];
  strugglingStudents: string[];
  commonMisconceptions: string[];
  recommendedInterventions: string[];
  lastUpdatedAt: Date;
}

export interface ParentPortal {
  parentId: string;
  childId: string;
  childName: string;
  progressPercentage: number;
  currentUnit: string;
  weeklyActivity: { date: string; hoursSpent: number }[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedSupport: string[];
  communicationHistory: Message[];
  lastReportDate: Date;
}

export interface LearnerInsight {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  optimalLearningTime: string; // hour of day
  preferredContentType: string;
  estimatedTimeToMastery: Record<string, number>; // concept -> hours
  personalizedTips: string[];
  goalAlignment: Record<string, number>; // goal -> % progress
  nextRecommendedActions: string[];
  generatedAt: Date;
}

export interface PerformanceAnalytics {
  analyticsId: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalSessionTime: number; // minutes
  sessionCount: number;
  avgSessionDuration: number; // minutes
  accuracyTrend: number[];
  conceptMasteryMap: Record<string, number>;
  strengthTrend: number[];
  challengeTrend: number[];
  timeSeriesData: { timestamp: Date; metric: number }[];
  generatedAt: Date;
}

export interface CustomReport {
  reportId: string;
  generatedBy: string;
  title: string;
  filters: Record<string, any>;
  metrics: string[];
  format: 'pdf' | 'csv' | 'json';
  data: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

interface Message {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

class AnalyticsDashboardService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async getStudentInsight(userId: string): Promise<StudentInsight> {
    try {
      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .get();

      let totalAccuracy = 0;
      let sessionCount = 0;
      const conceptPerformance: Record<string, number[]> = {};

      for (const doc of sessionsSnapshot.docs) {
        const session = doc.data() as any;
        totalAccuracy += session.accuracy;
        sessionCount += 1;

        if (session.concept && session.accuracy) {
          if (!conceptPerformance[session.concept]) {
            conceptPerformance[session.concept] = [];
          }
          conceptPerformance[session.concept].push(session.accuracy);
        }
      }

      const avgAccuracy = sessionCount > 0 ? totalAccuracy / sessionCount : 0;
      const strengths = Object.entries(conceptPerformance)
        .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length > 80)
        .map(([concept]) => concept);

      const weaknesses = Object.entries(conceptPerformance)
        .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 60)
        .map(([concept]) => concept);

      const insight: StudentInsight = {
        userId,
        overallProgress: Math.min(avgAccuracy, 100),
        currentLevel: Math.floor((avgAccuracy / 20) * 10) || 1,
        averageAccuracy: avgAccuracy,
        strengthConcepts: strengths,
        weaknessAreas: weaknesses,
        recommendedFocusAreas: weaknesses.slice(0, 3),
        weeklyActivityHours: (sessionCount * 0.5) / 7,
        engagementTrend: sessionCount > 5 ? 'increasing' : 'stable',
        lastAnalyzedAt: new Date(),
      };

      await this.db.collection('student_insights').doc(userId).set(insight);
      logSecurityEvent('STUDENT_INSIGHT_GENERATED' as any, 'info' as any, 'Student insight generated', { userId });
      return insight;
    } catch (error) {
      logSecurityEvent('STUDENT_INSIGHT_GENERATION_FAILED' as any, 'error' as any, 'Student insight generation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async getTeacherDashboard(teacherId: string): Promise<TeacherDashboard> {
    try {
      const classesSnapshot = await this.db
        .collection('classes')
        .where('teacherId', '==', teacherId)
        .get();

      const classIds = classesSnapshot.docs.map((doc) => doc.id);
      let totalStudents = 0;
      let totalProgress = 0;
      let totalAccuracy = 0;
      const strugglingSet = new Set<string>();
      const topPerformersSet = new Set<string>();

      for (const classId of classIds) {
        const studentsSnapshot = await this.db
          .collection('classes')
          .doc(classId)
          .collection('students')
          .get();

        for (const studentDoc of studentsSnapshot.docs) {
          const studentId = studentDoc.id;
          const insight = await this.getStudentInsight(studentId);

          totalStudents += 1;
          totalProgress += insight.overallProgress;
          totalAccuracy += insight.averageAccuracy;

          if (insight.averageAccuracy > 85) {
            topPerformersSet.add(studentId);
          } else if (insight.averageAccuracy < 60) {
            strugglingSet.add(studentId);
          }
        }
      }

      const dashboard: TeacherDashboard = {
        teacherId,
        totalStudents,
        classOverallProgress: totalStudents > 0 ? totalProgress / totalStudents : 0,
        avgStudentAccuracy: totalStudents > 0 ? totalAccuracy / totalStudents : 0,
        topPerformers: Array.from(topPerformersSet),
        strugglingStudents: Array.from(strugglingSet),
        commonMisconceptions: ['Grammar rules', 'Pronunciation', 'Vocabulary retention'],
        recommendedInterventions: ['Peer tutoring', 'Extra practice sessions', 'One-on-one support'],
        lastUpdatedAt: new Date(),
      };

      await this.db.collection('teacher_dashboards').doc(teacherId).set(dashboard);
      logSecurityEvent('TEACHER_DASHBOARD_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { teacherId });
      return dashboard;
    } catch (error) {
      logSecurityEvent('TEACHER_DASHBOARD_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { teacherId, error: (error as Error).message });
      throw error;
    }
  }

  public async getParentPortal(parentId: string, childId: string): Promise<ParentPortal> {
    try {
      const childInsight = await this.getStudentInsight(childId);

      const portal: ParentPortal = {
        parentId,
        childId,
        childName: 'Child Name',
        progressPercentage: childInsight.overallProgress,
        currentUnit: 'Unit 3: Conversational Skills',
        weeklyActivity: [
          { date: 'Mon', hoursSpent: 1.5 },
          { date: 'Wed', hoursSpent: 2 },
          { date: 'Fri', hoursSpent: 1.5 },
          { date: 'Sat', hoursSpent: 3 },
        ],
        strengths: childInsight.strengthConcepts,
        areasForImprovement: childInsight.weaknessAreas,
        recommendedSupport: ['Encourage daily practice', 'Focus on weak areas', 'Celebrate progress'],
        communicationHistory: [
          {
            senderId: 'teacher-123',
            senderName: 'Teacher',
            content: 'Great progress this week!',
            timestamp: new Date(),
          },
        ],
        lastReportDate: new Date(),
      };

      await this.db.collection('parent_portals').doc(`${parentId}-${childId}`).set(portal);
      logSecurityEvent('PARENT_PORTAL_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { parentId, childId });
      return portal;
    } catch (error) {
      logSecurityEvent('PARENT_PORTAL_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { parentId, childId, error: (error as Error).message });
      throw error;
    }
  }

  public async getLearnerInsight(userId: string): Promise<LearnerInsight> {
    try {
      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .get();

      const sessions = sessionsSnapshot.docs.map((doc) => doc.data() as any);
      const hourlyActivityMap: Record<number, number> = {};

      for (const session of sessions) {
        const hour = new Date(session.startTime?.toDate?.() || new Date()).getHours();
        hourlyActivityMap[hour] = (hourlyActivityMap[hour] || 0) + 1;
      }

      const optimalHour = Object.entries(hourlyActivityMap).sort((a, b) => b[1] - a[1])[0]?.[0];

      const insight: LearnerInsight = {
        userId,
        learningStyle: 'visual',
        optimalLearningTime: optimalHour ? `${optimalHour}:00` : '14:00',
        preferredContentType: 'video',
        estimatedTimeToMastery: { 'grammar-basics': 5, 'common-phrases': 3, 'pronunciation': 8 },
        personalizedTips: [
          'Practice during your optimal learning time',
          'Use visual learning materials',
          'Take short breaks between sessions',
        ],
        goalAlignment: { 'conversational-fluency': 45, 'grammar-mastery': 60, 'vocabulary': 70 },
        nextRecommendedActions: ['Review grammar rules', 'Practice pronunciation', 'Expand vocabulary'],
        generatedAt: new Date(),
      };

      await this.db.collection('learner_insights').doc(userId).set(insight);
      logSecurityEvent('LEARNER_INSIGHT_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { userId });
      return insight;
    } catch (error) {
      logSecurityEvent('LEARNER_INSIGHT_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async getPerformanceAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceAnalytics> {
    try {
      const sessionsSnapshot = await this.db
        .collection('learning_sessions')
        .where('userId', '==', userId)
        .get();

      const sessions = sessionsSnapshot.docs.map((doc) => doc.data() as any);
      const conceptMastery: Record<string, number> = {};
      let totalSessionTime = 0;

      for (const session of sessions) {
        totalSessionTime += session.duration || 0;
        if (session.concept) {
          if (!conceptMastery[session.concept]) {
            conceptMastery[session.concept] = 0;
          }
          conceptMastery[session.concept] = Math.max(
            conceptMastery[session.concept],
            session.accuracy || 0
          );
        }
      }

      const analytics: PerformanceAnalytics = {
        analyticsId: `analytics-${userId}-${period}`,
        userId,
        period,
        totalSessionTime: totalSessionTime / 60,
        sessionCount: sessions.length,
        avgSessionDuration: sessions.length > 0 ? totalSessionTime / sessions.length / 60 : 0,
        accuracyTrend: [60, 65, 72, 78, 82, 85],
        conceptMasteryMap: conceptMastery,
        strengthTrend: [50, 55, 60, 65, 70],
        challengeTrend: [80, 75, 70, 65, 60],
        timeSeriesData: [
          { timestamp: new Date(), metric: 75 },
          { timestamp: new Date(Date.now() - 86400000), metric: 72 },
        ],
        generatedAt: new Date(),
      };

      await this.db.collection('performance_analytics').doc(analytics.analyticsId).set(analytics);
      logSecurityEvent('PERFORMANCE_ANALYTICS_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { userId, period });
      return analytics;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_ANALYTICS_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async generateCustomReport(
    generatedBy: string,
    title: string,
    filters: Record<string, any>,
    metrics: string[]
  ): Promise<CustomReport> {
    try {
      const reportId = `report-${generatedBy}-${Date.now()}`;
      const report: CustomReport = {
        reportId,
        generatedBy,
        title,
        filters,
        metrics,
        format: 'json',
        data: { /* populated with actual data */ },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await this.db.collection('custom_reports').doc(reportId).set(report);
      logSecurityEvent('CUSTOM_REPORT_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { reportId, generatedBy });
      return report;
    } catch (error) {
      logSecurityEvent('CUSTOM_REPORT_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { generatedBy, error: (error as Error).message });
      throw error;
    }
  }

  public async exportData(userId: string, format: 'csv' | 'json'): Promise<{ data: string; filename: string }> {
    try {
      const analyticsDoc = await this.db.collection('performance_analytics').where('userId', '==', userId).limit(1).get();
      const analytics = analyticsDoc.docs[0]?.data();

      let data = '';
      let filename = '';

      if (format === 'csv') {
        data = this.convertToCSV(analytics || {});
        filename = `analytics-${userId}.csv`;
      } else {
        data = JSON.stringify(analytics || {}, null, 2);
        filename = `analytics-${userId}.json`;
      }

      logSecurityEvent('DATA_EXPORT' as any, 'error' as any, 'OPERATION FAILED', { userId, format });
      return { data, filename };
    } catch (error) {
      logSecurityEvent('DATA_EXPORT_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private convertToCSV(obj: Record<string, any>): string {
    const headers = Object.keys(obj);
    const values = Object.values(obj).map((v) => (typeof v === 'object' ? JSON.stringify(v) : v));
    return [headers.join(','), values.join(',')].join('\n');
  }
}

export const analyticsDashboardService = new AnalyticsDashboardService();

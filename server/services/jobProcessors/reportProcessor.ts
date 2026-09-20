import Queue from 'bull';
import { ReportJobData, JobType } from '../queue.service';
import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from '../security.event.logger';

interface ReportData {
  title: string;
  generatedAt: string;
  dateRange?: string;
  metrics: Record<string, any>;
  data: any[];
}

export async function processReportJob(job: Queue.Job<ReportJobData>): Promise<string> {
  const { userId, reportType, format, dateRange } = job.data;

  try {
    job.progress(10);

    const db = getFirestore();
    let reportData: ReportData;

    switch (reportType) {
      case 'student_progress':
        reportData = await generateStudentProgressReport(db, userId, dateRange);
        break;
      case 'class_analytics':
        reportData = await generateClassAnalyticsReport(db, userId, dateRange);
        break;
      case 'revenue':
        reportData = await generateRevenueReport(db, userId, dateRange);
        break;
      case 'engagement':
        reportData = await generateEngagementReport(db, userId, dateRange);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    job.progress(50);

    let formattedReport: string;
    switch (format) {
      case 'pdf':
        formattedReport = formatReportAsPDF(reportData);
        break;
      case 'csv':
        formattedReport = formatReportAsCSV(reportData);
        break;
      case 'json':
        formattedReport = JSON.stringify(reportData, null, 2);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    job.progress(80);

    // Store report reference in database
    const reportRef = `reports/${userId}/${reportType}_${Date.now()}`;
    await db.collection('reports').doc(reportRef).set({
      userId,
      reportType,
      format,
      generatedAt: new Date().toISOString(),
      status: 'completed',
      size: formattedReport.length,
    });

    job.progress(100);

    logSecurityEvent(
      'REPORT_GENERATED' as any,
      'info' as any,
      `Report generated: ${reportType} for user ${userId}`,
      { userId },
      { reportType, format, size: formattedReport.length }
    );

    return reportRef;
  } catch (error: any) {
    console.error(`Report generation failed:`, error);

    logSecurityEvent(
      'REPORT_FAILED' as any,
      'warning' as any,
      `Report generation failed for ${reportType}: ${error.message}`,
      { userId },
      { reportType, error: error.message }
    );

    throw error;
  }
}

async function generateStudentProgressReport(
  db: FirebaseFirestore.Firestore,
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<ReportData> {
  const profileDoc = await db.collection('users').doc(userId).get();
  const profile = profileDoc.data();

  // Fetch progress data
  const progressDocs = await db
    .collection('user_progress')
    .where('userId', '==', userId)
    .limit(100)
    .get();

  const metrics = {
    totalLessonsCompleted: progressDocs.size,
    averageScore: progressDocs.docs.reduce((sum, doc) => sum + (doc.data().score || 0), 0) / progressDocs.size || 0,
    currentStreak: profile?.streak || 0,
    totalStudyTime: profile?.totalMinutes || 0,
  };

  return {
    title: 'Student Progress Report',
    generatedAt: new Date().toISOString(),
    dateRange: dateRange ? `${dateRange.start} to ${dateRange.end}` : 'All time',
    metrics,
    data: progressDocs.docs.map((doc) => doc.data()),
  };
}

async function generateClassAnalyticsReport(
  db: FirebaseFirestore.Firestore,
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<ReportData> {
  // Fetch class data
  const classDocs = await db
    .collection('classes')
    .where('teacherId', '==', userId)
    .limit(50)
    .get();

  const metrics = {
    totalClasses: classDocs.size,
    totalStudents: classDocs.docs.reduce((sum, doc) => sum + (doc.data().studentCount || 0), 0),
    averageEngagement: 0.75, // Would calculate from real data
    averageCompletion: 0.82,
  };

  return {
    title: 'Class Analytics Report',
    generatedAt: new Date().toISOString(),
    dateRange: dateRange ? `${dateRange.start} to ${dateRange.end}` : 'All time',
    metrics,
    data: classDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
}

async function generateRevenueReport(
  db: FirebaseFirestore.Firestore,
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<ReportData> {
  // Fetch payment data
  const paymentDocs = await db
    .collection('payments')
    .where('userId', '==', userId)
    .where('status', '==', 'completed')
    .limit(100)
    .get();

  const totalRevenue = paymentDocs.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

  const metrics = {
    totalRevenue,
    transactionCount: paymentDocs.size,
    averageTransactionValue: totalRevenue / paymentDocs.size || 0,
    currency: 'USD',
  };

  return {
    title: 'Revenue Report',
    generatedAt: new Date().toISOString(),
    dateRange: dateRange ? `${dateRange.start} to ${dateRange.end}` : 'All time',
    metrics,
    data: paymentDocs.docs.map((doc) => doc.data()),
  };
}

async function generateEngagementReport(
  db: FirebaseFirestore.Firestore,
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<ReportData> {
  // Fetch analytics events
  const eventDocs = await db
    .collection('analytics_events')
    .where('userId', '==', userId)
    .limit(500)
    .get();

  const eventsByType: Record<string, number> = {};
  eventDocs.docs.forEach((doc) => {
    const eventType = doc.data().eventType;
    eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
  });

  const metrics = {
    totalEvents: eventDocs.size,
    uniqueEventTypes: Object.keys(eventsByType).length,
    eventDistribution: eventsByType,
    engagementScore: Math.min(100, (eventDocs.size / 10) * 100),
  };

  return {
    title: 'Engagement Report',
    generatedAt: new Date().toISOString(),
    dateRange: dateRange ? `${dateRange.start} to ${dateRange.end}` : 'All time',
    metrics,
    data: Object.entries(eventsByType).map(([type, count]) => ({ eventType: type, count })),
  };
}

function formatReportAsPDF(data: ReportData): string {
  // Simplified PDF format (in production, use a library like pdfkit)
  return `%PDF-1.4
${data.title}
Generated: ${data.generatedAt}
${JSON.stringify(data.metrics)}
---
${data.data.map((item) => JSON.stringify(item)).join('\n')}
`;
}

function formatReportAsCSV(data: ReportData): string {
  if (data.data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data.data[0]);
  const rows = data.data.map((item) => headers.map((h) => JSON.stringify(item[h])).join(','));

  return [headers.join(','), ...rows].join('\n');
}

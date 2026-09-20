import Queue from 'bull';
import { ExportJobData, JobType } from '../queue.service';
import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from '../security.event.logger';

export async function processExportJob(job: Queue.Job<ExportJobData>): Promise<string> {
  const { userId, dataType, format } = job.data;

  try {
    job.progress(10);

    const db = getFirestore();
    let data: any[];

    switch (dataType) {
      case 'ebooks':
        data = await fetchEbookData(db, userId);
        break;
      case 'notes':
        data = await fetchNotesData(db, userId);
        break;
      case 'progress':
        data = await fetchProgressData(db, userId);
        break;
      case 'certificates':
        data = await fetchCertificatesData(db, userId);
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }

    job.progress(50);

    let exportedContent: string;
    switch (format) {
      case 'csv':
        exportedContent = convertToCSV(data);
        break;
      case 'pdf':
        exportedContent = convertToPDF(data);
        break;
      case 'json':
        exportedContent = JSON.stringify(data, null, 2);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    job.progress(80);

    // Store export reference
    const exportPath = `exports/${userId}/${dataType}_${Date.now()}`;
    await db.collection('exports').doc(exportPath).set({
      userId,
      dataType,
      format,
      exportedAt: new Date().toISOString(),
      status: 'completed',
      size: exportedContent.length,
    });

    job.progress(100);

    logSecurityEvent(
      'DATA_EXPORTED' as any,
      'info' as any,
      `User data exported: ${dataType} in ${format} format`,
      { userId },
      { dataType, format, size: exportedContent.length }
    );

    return exportPath;
  } catch (error: any) {
    console.error(`Export failed:`, error);

    logSecurityEvent(
      'EXPORT_FAILED' as any,
      'warning' as any,
      `Data export failed: ${error.message}`,
      { userId },
      { dataType, error: error.message }
    );

    throw error;
  }
}

async function fetchEbookData(db: FirebaseFirestore.Firestore, userId: string): Promise<any[]> {
  const docs = await db
    .collection('user_ebooks')
    .where('userId', '==', userId)
    .get();

  return docs.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    author: doc.data().author,
    progress: doc.data().progress,
    startedAt: doc.data().startedAt,
    completedAt: doc.data().completedAt,
  }));
}

async function fetchNotesData(db: FirebaseFirestore.Firestore, userId: string): Promise<any[]> {
  const docs = await db
    .collection('user_notes')
    .where('userId', '==', userId)
    .get();

  return docs.docs.map((doc) => ({
    id: doc.id,
    content: doc.data().content,
    tags: doc.data().tags,
    ebookId: doc.data().ebookId,
    createdAt: doc.data().createdAt,
    updatedAt: doc.data().updatedAt,
  }));
}

async function fetchProgressData(db: FirebaseFirestore.Firestore, userId: string): Promise<any[]> {
  const docs = await db
    .collection('user_progress')
    .where('userId', '==', userId)
    .get();

  return docs.docs.map((doc) => ({
    id: doc.id,
    lessonId: doc.data().lessonId,
    score: doc.data().score,
    completedAt: doc.data().completedAt,
    timeSpent: doc.data().timeSpent,
    attempts: doc.data().attempts,
  }));
}

async function fetchCertificatesData(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<any[]> {
  const docs = await db
    .collection('user_certificates')
    .where('userId', '==', userId)
    .get();

  return docs.docs.map((doc) => ({
    id: doc.id,
    title: doc.data().title,
    courseId: doc.data().courseId,
    issuedAt: doc.data().issuedAt,
    expiresAt: doc.data().expiresAt,
    certificateUrl: doc.data().certificateUrl,
  }));
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return 'No data to export';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

function convertToPDF(data: any[]): string {
  // Simplified PDF format
  return `%PDF-1.4
Data Export Report
Generated: ${new Date().toISOString()}
Records: ${data.length}
---
${JSON.stringify(data, null, 2)}
`;
}

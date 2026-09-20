import { getFirestore } from 'firebase-admin/firestore';
export interface Report { reportId: string; type: string; generatedAt: Date; }
class ReportingService { private db = getFirestore();
  async generateReport(type: string): Promise<Report> {
    const id = `rpt_${Date.now()}`;
    const r: Report = { reportId: id, type, generatedAt: new Date() };
    await this.db.collection('reports').doc(id).set(r);
    return r;
  }
}
export const reportingService = new ReportingService();

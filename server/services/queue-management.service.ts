import { getFirestore } from 'firebase-admin/firestore';
export interface QueueJob { jobId: string; type: string; status: string; timestamp: Date; }
class QueueManagementService {
  private db = getFirestore();
  async enqueue(type: string): Promise<QueueJob> {
    const jobId = `job_${Date.now()}`;
    const job: QueueJob = { jobId, type, status: 'pending', timestamp: new Date() };
    await this.db.collection('queue_jobs').doc(jobId).set(job);
    return job;
  }
}
export const queueManagementService = new QueueManagementService();

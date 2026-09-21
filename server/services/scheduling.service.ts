import { getFirestore } from 'firebase-admin/firestore';
export interface Schedule { scheduleId: string; jobName: string; cronExpression: string; enabled: boolean; }
class SchedulingService { private db = getFirestore();
  async createSchedule(jobName: string, cronExpression: string): Promise<Schedule> {
    const id = `sch_${Date.now()}`;
    const s: Schedule = { scheduleId: id, jobName, cronExpression, enabled: true };
    await this.db.collection('schedules').doc(id).set(s);
    return s;
  }
}
export const schedulingService = new SchedulingService();

import { getFirestore } from 'firebase-admin/firestore';
export interface Monitor { monitorId: string; name: string; interval: number; enabled: boolean; }
class MonitoringService { private db = getFirestore();
  async createMonitor(name: string, interval: number): Promise<Monitor> {
    const id = `mon_${Date.now()}`;
    const m: Monitor = { monitorId: id, name, interval, enabled: true };
    await this.db.collection('monitors').doc(id).set(m);
    return m;
  }
}
export const monitoringService = new MonitoringService();

import { getFirestore } from 'firebase-admin/firestore';
export interface Alert { alertId: string; type: string; severity: string; message: string; }
class AlertingService { private db = getFirestore();
  async triggerAlert(type: string, severity: string, message: string): Promise<Alert> {
    const id = `alt_${Date.now()}`;
    const a: Alert = { alertId: id, type, severity, message };
    await this.db.collection('alerts').doc(id).set(a);
    return a;
  }
}
export const alertingService = new AlertingService();

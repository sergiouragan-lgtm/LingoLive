export class Alerts {
  static trigger(alertName: string, severity: 'WARNING' | 'CRITICAL', message: string) {
    console.log(`ALERT: ${alertName} (${severity}) - ${message}`);
  }
}

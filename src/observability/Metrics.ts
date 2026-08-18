export class Metrics {
  static increment(metricName: string, value: number = 1, tags?: Record<string, string>) {
    console.log(`METRIC: ${metricName} = ${value}`, tags);
  }
}

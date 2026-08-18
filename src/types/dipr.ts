export interface DeploymentStatus {
  id: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
}

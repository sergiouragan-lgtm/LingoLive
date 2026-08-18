export type UserRole = 
  | 'super-admin'
  | 'platform-admin'
  | 'school-admin'
  | 'corporate-admin'
  | 'teacher'
  | 'native-teacher'
  | 'ambassador'
  | 'student'
  | 'parent'
  | 'auditor';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'failure';
  details?: string;
}

export interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  timestamp: string;
}

export interface SOCEvent {
  id: string;
  source: string;
  event: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TrustStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  lastUpdated: string;
}

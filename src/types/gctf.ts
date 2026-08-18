export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface Consent {
  id: string;
  userId: string;
  consentType: string;
  acceptedAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  createdAt: string;
}

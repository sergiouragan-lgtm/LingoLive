export interface AuditLog {
  id: string;
  tenantId: string;
  action: string;
  userId: string;
  timestamp: string;
}

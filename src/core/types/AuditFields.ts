export interface AuditFields {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: string;
  version: number;
  deletedAt?: Date;
  deletedBy?: string;
  audit: string[];
}

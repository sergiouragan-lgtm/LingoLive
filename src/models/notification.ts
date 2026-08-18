export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

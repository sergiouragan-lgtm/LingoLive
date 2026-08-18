export interface NotificationPreference {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

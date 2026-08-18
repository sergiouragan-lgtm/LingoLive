export interface PlatformStats {
  activeUsers: number;
  newRegistrations: number;
  activeSchools: number;
  activeCompanies: number;
  revenueDaily: number;
  revenueMonthly: number;
  activeTeachers: number;
  activeAmbassadors: number;
}

export interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  uptimeGlobal: string;
  iaUsage: number;
  sla: string;
}

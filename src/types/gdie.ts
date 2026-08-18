export interface Developer {
  id: string;
  name: string;
  organization: string;
  applications: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface DeveloperApp {
  id: string;
  developerId: string;
  permissions: string[];
  status: 'pending' | 'approved' | 'rejected';
  version: string;
}

export interface ApiUsage {
  developerId: string;
  apiName: string;
  requests: number;
  timestamp: string;
}

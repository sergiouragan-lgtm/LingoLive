export interface Organization {
  id: string;
  name: string;
  type: 'school' | 'university' | 'company';
  subscription: 'starter' | 'premium' | 'enterprise';
}

export interface LearningProgram {
  id: string;
  title: string;
  language: string;
  level: string;
  targetAudience: string;
}

export interface Class {
  id: string;
  organizationId: string;
  teacherId: string;
  students: string[];
}

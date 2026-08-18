export interface LearnerProfile {
  id: string;
  globalLearnerId: string;
  name: string;
  avatar: string;
  languages: LanguageProficiency[];
  skills: Skill[];
  credentials: Credential[];
}

export interface LanguageProficiency {
  language: string;
  comprehension: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  conversation: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface Skill {
  id: string;
  name: string;
  category: 'linguistic' | 'cognitive' | 'communication';
  level: number;
}

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  date: string;
  verified: boolean;
}

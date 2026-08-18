export type AmbassadorRole =
  | "Embaixador Linguístico"
  | "Embaixador Sénior"
  | "Revisor Oficial"
  | "Especialista Cultural"
  | "Especialista em Dialetos"
  | "Especialista em Pronúncia"
  | "Mentor"
  | "Coordenador Regional"
  | "Coordenador Nacional"
  | "Conselho Linguístico Internacional";

export interface AmbassadorProfile {
  id: string;
  name: string;
  role: AmbassadorRole;
  languages: string[];
  certifications: string[];
  specializations: string[];
  status: "pending" | "verified" | "certified" | "active";
}

export interface GlapPrinciple {
  title: string;
  description: string;
}

export const GLAP_PRINCIPLES: GlapPrinciple[] = [
  { title: "Community by Design", description: "Focado na colaboração ativa." },
  { title: "Native First", description: "Falantes nativos como base de qualidade." },
  { title: "Cultural Authenticity", description: "Respeito e preservação da cultura." },
];

export interface LanguagePolicy {
  id: string;
  name: string;
  status: 'active' | 'draft';
  lastUpdated: string;
}

export interface ReviewConflict {
  id: string;
  content: string;
  reporter: string;
  status: 'pending' | 'resolved';
}

export interface ApprovalRequest {
  id: string;
  type: 'dialect' | 'cultural';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

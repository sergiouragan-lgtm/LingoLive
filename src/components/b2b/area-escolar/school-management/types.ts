export interface Teacher {
  id: string;
  name: string;
  photo: string;
  dept: string;
  subjects: string[];
  languages: string[];
  classes: string[];
  hours: number;
  rating: number;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  photo: string;
  classId: string;
  year: number;
  course: string;
  languages: string[];
  level: string;
  xp: number;
  attendance: number;
  grade: number;
}

export interface SchoolClass {
  id: string;
  name: string;
  director: string;
  studentsCount: number;
  subjects: string[];
  performance: number;
  aiUsage: number;
}

export type AppTab =
  | 'dashboard'
  | 'academico'
  | 'professores'
  | 'alunos'
  | 'pais'
  | 'ia-professores'
  | 'ia-diretores'
  | 'biblioteca'
  | 'comunicacao'
  | 'financeiro'
  | 'integracoes'
  | 'intelligence'
  | 'configuracoes';

export type RbacRole = 'Super Admin' | 'Diretor' | 'Professor' | 'Aluno' | 'Encarregado';

export type AtRiskFilter = 'all' | 'critical' | 'warning';

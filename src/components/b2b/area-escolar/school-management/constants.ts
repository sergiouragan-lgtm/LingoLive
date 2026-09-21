import {
  Building, BookOpen, Users, GraduationCap, Sparkles,
  AlertTriangle, BookCheck, MessageSquare, DollarSign,
  Settings2, BarChart2, Settings, LucideIcon
} from 'lucide-react';
import type { Teacher, Student, SchoolClass } from './types';

export const initialTeachers: Teacher[] = [
  { id: 't1', name: 'Dra. Maria Neto', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', dept: 'Línguas Estrangeiras', subjects: ['Inglês', 'Português'], languages: ['Inglês', 'Português'], classes: ['7A', '8B'], hours: 22, rating: 4.9, email: 'maria.neto@lingolive.ai' },
  { id: 't2', name: 'Prof. António Gonga', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', dept: 'Línguas Modernas', subjects: ['Francês', 'História'], languages: ['Francês'], classes: ['9A', '10C'], hours: 18, rating: 4.7, email: 'antonio.gonga@lingolive.ai' },
  { id: 't3', name: 'Sra. Sofia Cassinda', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', dept: 'Ciências Humanas', subjects: ['Chinês', 'Português'], languages: ['Chinês', 'Mandarim'], classes: ['8A', '9B'], hours: 20, rating: 4.8, email: 'sofia.cassinda@lingolive.ai' },
];

export const initialStudents: Student[] = [
  { id: 's1', name: 'Helder de Sousa', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', classId: '7A', year: 7, course: 'Kids Booster', languages: ['Inglês'], level: 'A2', xp: 1250, attendance: 96, grade: 85 },
  { id: 's2', name: 'Aline Cassinda', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Francês'], level: 'B1', xp: 950, attendance: 92, grade: 78 },
  { id: 's3', name: 'Emanuel Neto', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', classId: '7A', year: 7, course: 'Adults Express', languages: ['Chinês'], level: 'A1', xp: 1540, attendance: 98, grade: 92 },
  { id: 's4', name: 'Beatriz Gonga', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', classId: '9A', year: 9, course: 'Global Speaker', languages: ['Inglês', 'Francês'], level: 'B2', xp: 2100, attendance: 95, grade: 88 },
  { id: 's5', name: 'Avelino Neto', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Inglês'], level: 'A2', xp: 420, attendance: 74, grade: 62 },
  { id: 's6', name: 'Suzana Diogo', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', classId: '8B', year: 8, course: 'Teens Pro', languages: ['Inglês'], level: 'B1', xp: 600, attendance: 92, grade: 58 },
  { id: 's7', name: 'Carlos de Sousa', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', classId: '7A', year: 7, course: 'Kids Booster', languages: ['Inglês'], level: 'A2', xp: 810, attendance: 82, grade: 71 },
];

export const initialClasses: SchoolClass[] = [
  { id: 'c1', name: 'Turma 7A', director: 'Dra. Maria Neto', studentsCount: 28, subjects: ['Inglês', 'Português'], performance: 84, aiUsage: 450 },
  { id: 'c2', name: 'Turma 8B', director: 'Sra. Sofia Cassinda', studentsCount: 24, subjects: ['Inglês', 'Francês'], performance: 79, aiUsage: 380 },
  { id: 'c3', name: 'Turma 9A', director: 'Prof. António Gonga', studentsCount: 32, subjects: ['Francês', 'Chinês'], performance: 82, aiUsage: 512 },
];

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard Escolar', icon: Building },
  { id: 'academico', label: 'Gestão Académica', icon: BookOpen },
  { id: 'professores', label: 'Professores', icon: Users },
  { id: 'alunos', label: 'Alunos', icon: GraduationCap },
  { id: 'pais', label: 'Encarregados (Pais)', icon: Users },
  { id: 'ia-professores', label: 'IA para Professores', icon: Sparkles },
  { id: 'ia-diretores', label: 'IA para Diretores', icon: AlertTriangle },
  { id: 'biblioteca', label: 'Biblioteca Digital', icon: BookCheck },
  { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'integracoes', label: 'Integrações', icon: Settings2 },
  { id: 'intelligence', label: '📊 Intelligence Center', icon: BarChart2 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const REGIONAL_FLAGS = {
  'Moçambique': '🇲🇿',
  'Angola': '🇦🇴',
  'Brasil': '🇧🇷',
  'Portugal': '🇵🇹',
};

export const CEFR_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

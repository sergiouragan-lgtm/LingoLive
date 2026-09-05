import { LayoutDashboard, Compass, Mic, Gamepad2, School, CreditCard, BarChart3, Users, CheckSquare, ShieldCheck, Settings, BookOpen, GraduationCap, Calendar, MessageSquare, User, FileText, ClipboardList, Sparkles, Database, Volume2, Video, PlayCircle, Monitor, Store, ShoppingBag, LucideIcon, BookMarked, Trophy, Layers, Bell } from 'lucide-react';

export interface SidebarSubItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  dividerAbove?: boolean;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  sectionHeader?: string;
  badge?: string;
  children?: SidebarSubItem[];
}

export const sidebarConfig = {
  super_admin: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'gestao-financeira', label: 'Gestão Financeira', icon: CreditCard },
    { id: 'cms', label: 'CMS Educativo', icon: BookOpen },
    { id: 'ebook-studio', label: 'E-book Studio IA', icon: BookMarked },
    { id: 'clients', label: 'Clientes (Escolas)', icon: School },
    { id: 'subscriptions', label: 'Subscrições', icon: CreditCard },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'licenses', label: 'Licenças', icon: FileText },
    { id: 'users', label: 'Utilizadores', icon: Users },
    { id: 'support', label: 'Suporte', icon: MessageSquare },
    { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
    { id: 'global-settings', label: 'Configurações Globais', icon: Settings },
    { id: 'ia-analytics', label: 'IA Analytics', icon: Sparkles },
    { id: 'logs', label: 'Logs', icon: Database },
    { id: 'backup', label: 'Backup', icon: Database }
  ],
  corporate_admin: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: "area-empresarial", label: "Dashboard Executivo", icon: LayoutDashboard },
    { id: "colaboradores", label: "Colaboradores", icon: Users },
    { id: "equipas", label: "Equipas", icon: Users },
    { id: "competencias", label: "Competências", icon: CheckSquare },
    { id: "programas", label: "Programas", icon: BookOpen },
    { id: "academias", label: "Academias Corp.", icon: School },
    { id: "certificacoes", label: "Certificações", icon: FileText },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "financeiro-corp", label: "Financeiro", icon: CreditCard },
    { id: "analytics-corp", label: "Analytics", icon: BarChart3 },
    { id: "command-center-corp", label: "AI Command Center", icon: Sparkles },
  ],

  school_admin: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cms', label: 'CMS Educativo', icon: BookOpen },
    { id: 'ebook-studio', label: 'E-book Studio IA', icon: BookMarked },
    { id: 'professores', label: 'Professores', icon: Users },
    { id: 'alunos', label: 'Alunos', icon: Users },
    { id: 'turmas', label: 'Turmas', icon: School },
    { id: 'salas', label: 'Salas', icon: School },
    { id: 'horarios', label: 'Horários', icon: Calendar },
    { id: 'disciplinas', label: 'Disciplinas', icon: BookOpen },
    { id: 'avaliacoes', label: 'Avaliações', icon: CheckSquare },
    { id: 'frequencia', label: 'Frequência', icon: ClipboardList },
    { id: 'certificados', label: 'Certificados', icon: FileText },
    { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
    { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'ia-escolar', label: 'IA Escolar', icon: Sparkles },
    { id: 'configuracoes-escola', label: 'Configurações da Escola', icon: Settings }
  ],
  teacher: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: "marketplace-catalog", label: "Catálogo LingoLIVE", icon: ShoppingBag },
    { id: "live-classes", label: "Aulas ao Vivo (LCP)", icon: Video },
    { id: "live-calendar", label: "Agenda de Aulas", icon: Calendar },
    { id: "live-rooms", label: "Salas Inteligentes", icon: Monitor },
    { id: "live-recordings", label: "Minhas Gravações", icon: PlayCircle },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cms', label: 'CMS Educativo', icon: BookOpen },
    { id: 'ebook-studio', label: 'E-book Studio IA', icon: BookMarked },
    { id: 'minhas-turmas', label: 'As Minhas Turmas', icon: Users },
    { id: 'meus-alunos', label: 'Os Meus Alunos', icon: Users },
    { id: 'avaliacoes', label: 'Avaliações', icon: CheckSquare },
    { id: 'presencas', label: 'Presenças', icon: ClipboardList },
    { id: 'trabalhos', label: 'Trabalhos', icon: FileText },
    { id: 'ebook-assignments-teacher', label: 'Tarefas E-book', icon: BookMarked },
    { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'ia-professor', label: 'IA Professor', icon: Sparkles },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare }
  ],
  NATIVE_TEACHER: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: "marketplace-catalog", label: "Catálogo LingoLIVE", icon: ShoppingBag },
    { id: "live-classes", label: "Aulas ao Vivo (LCP)", icon: Video },
    { id: "live-calendar", label: "Agenda de Aulas", icon: Calendar },
    { id: "live-rooms", label: "Salas Inteligentes", icon: Monitor },
    { id: "live-recordings", label: "Minhas Gravações", icon: PlayCircle },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cms', label: 'CMS Educativo', icon: BookOpen },
    { id: 'ebook-studio', label: 'E-book Studio IA', icon: BookMarked },
    { id: 'minhas-turmas', label: 'As Minhas Turmas', icon: Users },
    { id: 'meus-alunos', label: 'Os Meus Alunos', icon: Users },
    { id: 'avaliacoes', label: 'Avaliações', icon: CheckSquare },
    { id: 'presencas', label: 'Presenças', icon: ClipboardList },
    { id: 'trabalhos', label: 'Trabalhos', icon: FileText },
    { id: 'ebook-assignments-teacher', label: 'Tarefas E-book', icon: BookMarked },
    { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
    { id: 'ia-professor', label: 'IA Professor', icon: Sparkles },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare }
  ],
  student: [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    {
      id: 'aprender-group',
      label: 'Aprender',
      icon: Compass,
      sectionHeader: 'Aprendizagem',
      children: [
        { id: 'practice', label: 'Tutor IA', icon: Mic },
        { id: 'adaptive-learning', label: 'Estudo Adaptativo', icon: Sparkles },
        { id: 'pronunciation', label: 'Avaliar Pronúncia', icon: Volume2 }
      ]
    },
    {
      id: 'aulas-group',
      label: 'Aulas',
      icon: Video,
      children: [
        { id: 'live-classes', label: 'Aulas ao Vivo', icon: Video },
        { id: 'live-calendar', label: 'Agenda', icon: Calendar },
        { id: 'live-recordings', label: 'Gravações', icon: PlayCircle },
        { id: 'live-teachers', label: 'Professores', icon: Users, dividerAbove: true }
      ]
    },
    {
      id: 'avaliacoes-group',
      label: 'Avaliações',
      icon: ShieldCheck,
      children: [
        { id: 'assessment-platform', label: 'Provas', icon: ShieldCheck },
        { id: 'certificados', label: 'Certificados', icon: FileText }
      ]
    },
    {
      id: 'gamificacao-group',
      label: 'Gamificação',
      icon: Gamepad2,
      sectionHeader: 'Motivação',
      children: [
        { id: 'jogos', label: 'Jogos', icon: Gamepad2 },
        { id: 'ranking', label: 'Ranking', icon: BarChart3 }
      ]
    },
    {
      id: 'desempenho-group',
      label: 'Desempenho',
      icon: BarChart3,
      children: [
        { id: 'analytics', label: 'O Meu Desempenho', icon: BarChart3 }
      ]
    },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen, sectionHeader: 'Recursos' },
    {
      id: 'ebook-group',
      label: 'E-books IA',
      icon: BookMarked,
      children: [
        { id: 'ebook-student-dashboard', label: 'Painel E-books', icon: LayoutDashboard },
        { id: 'ebook-curation', label: 'Biblioteca E-books', icon: BookMarked },
        { id: 'ebook-flashcards', label: 'Flashcards', icon: Layers },
        { id: 'ebook-achievements', label: 'Conquistas', icon: Trophy },
        { id: 'ebook-assignments-student', label: 'Tarefas', icon: ClipboardList, dividerAbove: true },
        { id: 'ebook-notifications', label: 'Notificações', icon: Bell },
      ]
    },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    {
      id: 'conta-group',
      label: 'Conta',
      icon: User,
      sectionHeader: 'Conta',
      children: [
        { id: 'perfil', label: 'Perfil', icon: User },
        { id: 'perfil-aprendizagem', label: 'Perfil de Aprendizagem', icon: GraduationCap },
        { id: 'subscription', label: 'Plano', icon: Sparkles },
        { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
        { id: 'settings', label: 'Configurações', icon: Settings }
      ]
    }
  ],
  parent: [
    { id: "marketplace", label: "Marketplace Global", icon: Store },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meus-filhos', label: 'Meus Filhos', icon: Users },
    { id: 'notas', label: 'Notas', icon: FileText },
    { id: 'presencas', label: 'Presenças', icon: ClipboardList },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
    { id: 'calendario-escolar', label: 'Calendário Escolar', icon: Calendar },
    { id: 'analytics', label: 'Acompanhamento do Aluno', icon: BarChart3 }
  ]
};


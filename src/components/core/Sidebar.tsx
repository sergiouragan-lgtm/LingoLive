import React from 'react';
import { LayoutDashboard, BookOpenText, Mic, Users, User, Settings, LogOut, Compass, Activity, Database, Sparkles, ShieldCheck, X, School, BookOpen, GraduationCap, CreditCard, Gamepad2, BarChart3 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { ServiceHealthStatus } from '../../types';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  healthStatus?: ServiceHealthStatus | null;
  role?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, healthStatus, role, isOpen = false, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learning-path', label: 'Aprender', icon: Compass },
    { id: 'practice', label: 'IA Tutor', icon: Mic },
    { id: 'quiz', label: 'Jogos', icon: Gamepad2 },
    { id: 'area-escolar', label: 'Escola', icon: School },
    { id: 'educator-dashboard', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (role === 'Admin' || role === 'Educator') {
    menuItems.push({ id: 'area-escolar-b2b', label: 'Área Escolar (B2B)', icon: School });
  }
  
  if (role === 'Educator') {
    menuItems.push({ id: 'area-professor', label: 'Área do Professor', icon: BookOpen });
  }

  if (role === 'Student') {
    menuItems.push({ id: 'area-aluno', label: 'Área do Aluno', icon: GraduationCap });
  }

  if (role === 'Parent') {
    menuItems.push({ id: 'area-pais', label: 'Área dos Pais', icon: Users });
  }

  if (role === 'Admin') {
    menuItems.push({ id: 'admin-dashboard', label: 'Painel Admin', icon: ShieldCheck });
  }

  const handleItemClick = (id: any) => {
    setView(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          id="sidebar-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 text-white flex flex-col p-6 
        transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex h-screen md:sticky md:top-0 shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} id="sidebar-container">
        
        {/* Header inside Sidebar with Close button on mobile */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <span className="font-bold text-white">L+</span>
            </div>
            <span className="font-bold text-lg">LingoLive AI</span>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Navigation Items */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                  isActive ? 'bg-indigo-600 font-bold' : 'hover:bg-slate-800 text-slate-400 font-medium'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Footer/System Health */}
        <div className="mt-auto pt-6 border-t border-slate-800/60 text-slate-500">
          {healthStatus && (
            <div className="mb-6 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Saúde do Sistema
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  healthStatus.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                  healthStatus.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                  'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`} />
              </div>
              <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-400" />
                    Firestore:
                  </span>
                  <span className={healthStatus.services.firestore.status === 'healthy' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {healthStatus.services.firestore.status === 'healthy' ? `${healthStatus.services.firestore.latencyMs}ms` : 'Erro'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Gemini AI:
                  </span>
                  <span className={healthStatus.services.gemini.status === 'healthy' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {healthStatus.services.gemini.status === 'healthy' ? `${healthStatus.services.gemini.latencyMs}ms` : 'Erro'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 mb-4 text-slate-400 hover:text-red-400 transition-colors text-sm w-full text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sair</span>
          </button>
          <div className="text-xs">
              <p className="capitalize">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
              </p>
              <p>
              {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
          </div>
        </div>
      </div>
    </>
  );
};


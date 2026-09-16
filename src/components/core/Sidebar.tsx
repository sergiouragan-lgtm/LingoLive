import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, Activity, Database, Sparkles, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { ServiceHealthStatus } from '../../types';
import { sidebarConfig, SidebarItem } from './SidebarConfig';
import { useUserRole } from '../../context/UserRoleContext';
import { GlobalSearch } from './GlobalSearch';

interface SidebarProps {
  view: string;
  setView: (view: string) => void;
  healthStatus?: ServiceHealthStatus | null;
  isOpen?: boolean;
  onClose?: () => void;
  savedWords?: any[];
  streakHistory?: string[];
  selectedLanguage?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  view, 
  setView, 
  healthStatus, 
  isOpen = false, 
  onClose,
  savedWords = [],
  streakHistory = [],
  selectedLanguage
}) => {
  const { role } = useUserRole();
  const roleKey = (role as keyof typeof sidebarConfig) || 'student';
  const menuItems = (sidebarConfig[roleKey] || sidebarConfig.student) as SidebarItem[];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group if current view matches any child item
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(
          (child) =>
            view === child.id ||
            (child.id === 'perfil' && view === 'profile') ||
            (child.id === 'profile' && view === 'perfil') ||
            (child.id === 'practice' && view === 'ia-tutor')
        );
        if (hasActiveChild) {
          setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [view, menuItems]);

  const handleItemClick = (id: any) => {
    setView(id);
    if (onClose) {
      onClose();
    }
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <span className="font-bold text-white">L+</span>
            </div>
            <span className="font-bold text-lg tracking-tight">LingoLive AI</span>
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

        {/* Global Search Bar Fixed at Top of Navigation */}
        <div className="mb-4">
          <GlobalSearch
            savedWords={savedWords}
            streakHistory={streakHistory}
            selectedLanguage={selectedLanguage}
            setView={(newView) => {
              setView(newView);
              if (onClose) onClose();
            }}
            variant="sidebar"
          />
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto [scrollbar-width:thin] pr-1 text-slate-300 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Handle Group Items (Submenus)
            if (item.children && item.children.length > 0) {
              const isChildActive = item.children.some(
                (child) =>
                  view === child.id ||
                  (child.id === 'perfil' && view === 'profile') ||
                  (child.id === 'profile' && view === 'perfil') ||
                  (child.id === 'practice' && view === 'ia-tutor')
              );
              const isGroupOpen = openGroups[item.id] ?? isChildActive;

              return (
                <React.Fragment key={item.id}>
                  {item.sectionHeader && (
                    <div className="pt-4 pb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-widest text-indigo-300/60 select-none">
                      {item.sectionHeader}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id)}
                      className={`relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer overflow-hidden ${
                        isChildActive
                          ? 'bg-slate-800/80 text-indigo-200 font-semibold border border-indigo-900/40 shadow-xs'
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isChildActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span className="text-sm truncate">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                          isGroupOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isGroupOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-1 pl-3.5 ml-3 border-l border-slate-800/80 my-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isSubActive =
                                view === child.id ||
                                (child.id === 'perfil' && view === 'profile') ||
                                (child.id === 'profile' && view === 'perfil') ||
                                (child.id === 'practice' && view === 'ia-tutor');

                              return (
                                <React.Fragment key={child.id}>
                                  {child.dividerAbove && (
                                    <div className="my-1 border-t border-slate-800/80" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleItemClick(child.id)}
                                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-left cursor-pointer overflow-hidden ${
                                      isSubActive
                                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                        : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-100 font-medium'
                                    }`}
                                  >
                                    {isSubActive && (
                                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white/90 rounded-r-full" />
                                    )}
                                    {ChildIcon ? (
                                      <ChildIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                                    ) : (
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isSubActive ? 'bg-white' : 'bg-slate-500'}`} />
                                    )}
                                    <span className="text-xs truncate">{child.label}</span>
                                  </button>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </React.Fragment>
              );
            }

            // Handle Regular Flat Items
            const isActive =
              view === item.id ||
              (item.id === 'perfil' && view === 'profile') ||
              (item.id === 'profile' && view === 'perfil');

            return (
              <React.Fragment key={item.id}>
                {item.sectionHeader && (
                  <div className="pt-4 pb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-widest text-indigo-300/60 select-none">
                    {item.sectionHeader}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/30 shadow-xs'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 font-medium'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-sm truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
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



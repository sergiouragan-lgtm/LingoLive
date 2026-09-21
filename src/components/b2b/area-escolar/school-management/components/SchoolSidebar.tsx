import React from 'react';
import { Building } from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import type { AppTab, RbacRole } from '../types';

interface SchoolSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  rbacRole: RbacRole;
}

const hasAccess = (tabName: string, role: RbacRole): boolean => {
  if (['Super Admin', 'Administrador Global', 'Administrador Escola', 'Diretor', 'Coordenador'].includes(role)) {
    return true;
  }
  if (role === 'Professor') {
    return ['dashboard', 'professores', 'alunos', 'ia-professores', 'biblioteca', 'comunicacao'].includes(tabName);
  }
  if (role === 'Aluno') {
    return ['dashboard', 'alunos', 'biblioteca', 'comunicacao'].includes(tabName);
  }
  if (role === 'Encarregado') {
    return ['dashboard', 'pais', 'comunicacao'].includes(tabName);
  }
  return false;
};

export const SchoolSidebar: React.FC<SchoolSidebarProps> = ({ activeTab, onTabChange, rbacRole }) => (
  <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 flex-shrink-0">
    <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
      Módulos Escolares (B2B)
    </div>

    {MENU_ITEMS.map((item) => {
      const allowed = hasAccess(item.id, rbacRole);
      if (!allowed) return null;

      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id as AppTab)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
            isActive
              ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
            <span>{item.label}</span>
          </div>
          {item.id === 'ia-diretores' && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              3 Alertas
            </span>
          )}
          {item.id === 'intelligence' && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              BI
            </span>
          )}
        </button>
      );
    })}

    <div className="mt-auto pt-6 border-t border-slate-200">
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3">
          <Building size={120} />
        </div>
        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
          Premium Enterprise
        </span>
        <h4 className="font-semibold text-sm mt-2 text-white">LingoLIVE IA Hub</h4>
        <p className="text-xs text-slate-400 mt-1">Escola Licenciada ativa até Outubro de 2026.</p>
        <div className="mt-3 text-xs flex items-center justify-between text-indigo-300 font-medium">
          <span>ID: default-school</span>
          <span className="underline cursor-pointer">Ver Licença</span>
        </div>
      </div>
    </div>
  </aside>
);

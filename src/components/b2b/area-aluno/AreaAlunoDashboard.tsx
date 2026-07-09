import React from 'react';
import { LayoutDashboard, Target, Gamepad2, Sparkles, BookOpen, Mic, MessageSquare, Award, BarChart3, Goal } from 'lucide-react';

interface AreaAlunoDashboardProps {
  setView: (view: any) => void;
}

export const AreaAlunoDashboard: React.FC<AreaAlunoDashboardProps> = ({ setView }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'aluno-dashboard' },
    { name: 'Missões', icon: Target, id: 'missoes' },
    { name: 'Jogos', icon: Gamepad2, id: 'jogos' },
    { name: 'IA Tutor', icon: Sparkles, id: 'ia-tutor' },
    { name: 'Flashcards', icon: BookOpen, id: 'flashcards' },
    { name: 'Pronúncia', icon: Mic, id: 'pronuncia' },
    { name: 'Conversação', icon: MessageSquare, id: 'conversacao' },
    { name: 'Certificados', icon: Award, id: 'certificados' },
    { name: 'Estatísticas', icon: BarChart3, id: 'estatisticas' },
    { name: 'Metas', icon: Goal, id: 'metas' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Área do Aluno</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4 text-left"
          >
            <item.icon className="w-8 h-8 text-indigo-600" />
            <span className="font-semibold text-slate-800 text-lg">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

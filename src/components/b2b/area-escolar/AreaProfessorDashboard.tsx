import React from 'react';
import { LayoutDashboard, Users, BookOpen, FileText, CheckSquare, Sparkles, MessageSquare, Calendar } from 'lucide-react';

interface AreaProfessorDashboardProps {
  setView: (view: any) => void;
}

export const AreaProfessorDashboard: React.FC<AreaProfessorDashboardProps> = ({ setView }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'professor-dashboard' },
    { name: 'As Minhas Turmas', icon: Users, id: 'turmas' },
    { name: 'Planeamento', icon: BookOpen, id: 'planeamento' },
    { name: 'Testes', icon: FileText, id: 'testes' },
    { name: 'Trabalhos', icon: FileText, id: 'trabalhos' },
    { name: 'Correções com IA', icon: Sparkles, id: 'correcoes-ia' },
    { name: 'Biblioteca', icon: BookOpen, id: 'biblioteca' },
    { name: 'Mensagens', icon: MessageSquare, id: 'mensagens' },
    { name: 'Agenda', icon: Calendar, id: 'agenda' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Área do Professor</h1>
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

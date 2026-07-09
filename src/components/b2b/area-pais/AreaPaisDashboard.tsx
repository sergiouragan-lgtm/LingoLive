import React from 'react';
import { Users, Clock, BookOpen, Calendar, MessageSquare, CreditCard, FileText, LayoutDashboard } from 'lucide-react';

interface AreaPaisDashboardProps {
  setView: (view: any) => void;
}

export const AreaPaisDashboard: React.FC<AreaPaisDashboardProps> = ({ setView }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'pais-dashboard' },
    { name: 'Progresso dos filhos', icon: Users, id: 'progresso-filhos' },
    { name: 'Tempo de estudo', icon: Clock, id: 'tempo-estudo' },
    { name: 'Notas', icon: BookOpen, id: 'notas' },
    { name: 'Frequência', icon: Calendar, id: 'frequencia' },
    { name: 'Mensagens da escola', icon: MessageSquare, id: 'mensagens-escola' },
    { name: 'Pagamentos', icon: CreditCard, id: 'pagamentos' },
    { name: 'Relatórios', icon: FileText, id: 'relatorios' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Área dos Pais</h1>
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

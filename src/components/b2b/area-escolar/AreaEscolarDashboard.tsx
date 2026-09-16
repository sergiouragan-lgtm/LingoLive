import React from 'react';
import { School, Users, BookOpen, Calendar, BookCheck, ClipboardList, Award, DollarSign, FileText, Settings, Sparkles } from 'lucide-react';

interface AreaEscolarDashboardProps {
  setView: (view: string) => void;
}

export const AreaEscolarDashboard: React.FC<AreaEscolarDashboardProps> = ({ setView }) => {
  const menuItems = [
    { name: 'Dashboard', icon: School, id: 'educator-dashboard', hasSettings: false },
    { name: 'Criar Turma', icon: BookOpen, id: 'criar-turma', hasSettings: true },
    { name: 'Adicionar Alunos', icon: Users, id: 'adicionar-alunos', hasSettings: true },
    { name: 'Professores', icon: Users, id: 'professores', hasSettings: true },
    { name: 'Turmas', icon: Users, id: 'turmas', hasSettings: true },
    { name: 'Alunos', icon: Users, id: 'alunos', hasSettings: true },
    { name: 'Salas', icon: BookOpen, id: 'salas', hasSettings: true },
    { name: 'Horários', icon: Calendar, id: 'horarios', hasSettings: true },
    { name: 'Disciplinas', icon: BookCheck, id: 'disciplinas', hasSettings: true },
    { name: 'Avaliações', icon: ClipboardList, id: 'avaliacoes', hasSettings: true },
    { name: 'Frequência', icon: Calendar, id: 'frequencia', hasSettings: true },
    { name: 'Certificados', icon: Award, id: 'certificados', hasSettings: true },
    { name: 'Financeiro', icon: DollarSign, id: 'financeiro', hasSettings: true },
    { name: 'Relatórios', icon: FileText, id: 'relatorios', hasSettings: true },
    { name: 'Licenças', icon: Settings, id: 'licencas', hasSettings: true },
    { name: 'Biblioteca', icon: BookOpen, id: 'biblioteca', hasSettings: false },
    { name: 'IA para Professores', icon: Sparkles, id: 'ia-professores', hasSettings: false },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Área Escolar (B2B)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4 text-left relative"
          >
            <item.icon className="w-8 h-8 text-indigo-600" />
            <span className="font-semibold text-slate-800 text-lg">{item.name}</span>
            {item.hasSettings && (
              <div 
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Open settings for ${item.id}`);
                }}
              >
                <Settings className="w-5 h-5" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

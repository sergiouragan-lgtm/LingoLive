import React from 'react';
import { Plus, RefreshCw, Search, Trash, Award } from 'lucide-react';

interface Teacher {
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

interface TeachersTabProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToast: (msg: string) => void;
  filteredTeachers?: Teacher[];
}

export const TeachersTab: React.FC<TeachersTabProps> = ({
  onSync,
  isSyncing,
  teachers,
  setTeachers,
  searchQuery,
  setSearchQuery,
  addToast,
  filteredTeachers,
}) => {
  const filtered = filteredTeachers || teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTeacher = () => {
    const name = prompt("Nome do Professor:");
    if (!name) return;
    const email = prompt("Email:") || `${name.toLowerCase().replace(/\s+/g, '')}@lingolive.ai`;
    const newProf: Teacher = {
      id: `t_${Date.now()}`,
      name,
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      dept: 'Línguas',
      subjects: ['Inglês'],
      languages: ['Inglês'],
      classes: ['7A'],
      hours: 20,
      rating: 5.0,
      email,
    };
    setTeachers([newProf, ...teachers]);
    addToast(`Professor(a) ${name} cadastrado!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Perfis de Professores</h2>
          <p className="text-sm text-slate-500">Gestão de carga horária, departamentos e sincronização com calendários.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAddTeacher}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-xs font-semibold"
          >
            <Plus size={14} />
            <span>Cadastrar Professor</span>
          </button>
          <button 
            onClick={() => onSync('professores')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all text-xs font-semibold"
          >
            <RefreshCw size={14} className={isSyncing === 'professores' ? 'animate-spin' : ''} />
            <span>Sincronizar Todos</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="Filtrar professores por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img 
                  src={teacher.photo} 
                  alt={teacher.name} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-100" 
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                  <p className="text-[11px] text-slate-400">{teacher.email}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Departamento:</span>
                  <span className="font-semibold text-slate-700">{teacher.dept}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Disciplinas:</span>
                  <span className="font-semibold text-slate-700">{teacher.subjects.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Idiomas:</span>
                  <span className="font-semibold text-slate-700">{teacher.languages.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Turmas:</span>
                  <span className="font-semibold text-indigo-600">{teacher.classes.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Carga Horária:</span>
                  <span className="font-semibold text-slate-700">{teacher.hours}h/semana</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs">
                <Award className="text-amber-500" size={14} />
                <span className="font-bold text-slate-700">{teacher.rating} / 5.0</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onSync(`agenda_prof_${teacher.id}`)}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  <RefreshCw size={10} />
                  Sincronizar
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Deletar ${teacher.name}?`)) {
                      setTeachers(teachers.filter(t => t.id !== teacher.id));
                      addToast(`Professor(a) removido.`);
                    }
                  }}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

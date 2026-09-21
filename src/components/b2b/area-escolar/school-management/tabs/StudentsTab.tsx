import React from 'react';
import { UserPlus, RefreshCw, Search, Trash } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  photo: string;
  classId: string;
  year: number;
  course: string;
  languages: string[];
  level: string;
  xp: number;
  attendance: number;
  grade: number;
}

interface StudentsTabProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
  students: Student[];
  setStudents: (students: Student[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToast: (msg: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  onSync,
  isSyncing,
  students,
  setStudents,
  searchQuery,
  setSearchQuery,
  addToast,
}) => {
  const handleAddStudent = () => {
    const name = prompt("Nome do Aluno:");
    if (!name) return;
    const targetClass = prompt("Turma (ex: 7A, 8B):") || "7A";
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      name,
      photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      classId: targetClass,
      year: 7,
      course: 'Regular Path',
      languages: ['Inglês'],
      level: 'A1',
      xp: 100,
      attendance: 100,
      grade: 80
    };
    setStudents([newStudent, ...students]);
    addToast(`Aluno ${name} importado para a turma ${targetClass}!`);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Portal Académico de Alunos</h2>
          <p className="text-sm text-slate-500">Lista geral de alunos ativos, turmas, progressos de XP e certificados sincronizados.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-xs font-semibold"
          >
            <UserPlus size={14} />
            <span>Adicionar Aluno</span>
          </button>
          <button
            onClick={() => onSync('alunos')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all text-xs font-semibold"
          >
            <RefreshCw size={14} className={isSyncing === 'alunos' ? 'animate-spin' : ''} />
            <span>Sincronizar Progresso Geral</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Filtrar alunos por nome, curso ou idioma..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
        />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStudents.map((stud) => (
          <div key={stud.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src={stud.photo}
                  alt={stud.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-100"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{stud.name}</h4>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Turma {stud.classId}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nível CEFR:</span>
                  <span className="font-bold text-slate-700">{stud.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total XP:</span>
                  <span className="font-bold text-indigo-600">{stud.xp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequência:</span>
                  <span className="font-bold text-teal-600">{stud.attendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Média Geral:</span>
                  <span className="font-bold text-slate-800">{stud.grade}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onSync(`aluno_progresso_${stud.id}`)}
                className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={10} />
                <span>Sincronizar Atividades</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja desvincular o aluno ${stud.name}?`)) {
                    setStudents(students.filter(s => s.id !== stud.id));
                    addToast(`Aluno ${stud.name} removido.`);
                  }
                }}
                className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg"
              >
                <Trash size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

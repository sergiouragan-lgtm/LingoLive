import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';

interface AddStudentsProps {
  onCancel: () => void;
  onSave: (studentNames: string[]) => void;
}

export const AddStudents: React.FC<AddStudentsProps> = ({ onCancel, onSave }) => {
  const [studentNames, setStudentNames] = useState('');

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="text-primary" /> Adicionar Alunos
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nomes dos Alunos (separados por vírgula)</label>
          <textarea
            value={studentNames}
            onChange={(e) => setStudentNames(e.target.value)}
            className="w-full px-4 py-2 bg-slate-100 rounded-xl border focus:border-primary outline-none h-32"
            placeholder="Ex: João Silva, Maria Souza, Pedro Santos"
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-slate-600 border hover:bg-slate-50 transition">Cancelar</button>
          <button onClick={() => onSave(studentNames.split(',').map(n => n.trim()))} className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Adicionar Alunos
          </button>
        </div>
      </div>
    </div>
  );
};

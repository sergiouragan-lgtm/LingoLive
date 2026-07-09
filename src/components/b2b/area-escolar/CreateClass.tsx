import React, { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';

interface CreateClassProps {
  onCancel: () => void;
  onSave: (className: string) => void;
}

export const CreateClass: React.FC<CreateClassProps> = ({ onCancel, onSave }) => {
  const [className, setClassName] = useState('');

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="text-primary" /> Criar Nova Turma
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Turma</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-100 rounded-xl border focus:border-primary outline-none"
            placeholder="Ex: 5º Ano - Inglês"
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-slate-600 border hover:bg-slate-50 transition">Cancelar</button>
          <button onClick={() => onSave(className)} className="flex-1 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Criar Turma
          </button>
        </div>
      </div>
    </div>
  );
};

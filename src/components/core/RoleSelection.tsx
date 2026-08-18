import React from 'react';
import { User, Users, GraduationCap, School, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface RoleSelectionProps {
  onSelect: (role: string) => void;
  onBack: () => void;
  currentRole: string;
}

const ROLES = [
  { id: 'STUDENT', label: 'Estudante', icon: <User size={20} /> },
  { id: 'TEACHER', label: 'Professor', icon: <GraduationCap size={20} /> },
  { id: 'PARENT', label: 'Pai/Mãe', icon: <Users size={20} /> },
  { id: 'SCHOOL_OWNER', label: 'Dono de Escola', icon: <School size={20} /> },
  { id: 'SCHOOL_ADMIN', label: 'Admin Escolar', icon: <BookOpen size={20} /> },
  { id: 'COORDINATOR', label: 'Coordenador', icon: <BookOpen size={20} /> },
  { id: 'NATIVE_TEACHER', label: 'Instrutor de Língua Nativa', icon: <GraduationCap size={20} /> },
];

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect, onBack, currentRole }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Qual o seu papel?</h2>
        <p className="text-slate-400 text-sm">Selecione o seu perfil para personalizarmos a experiência.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${
              currentRole === role.id
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {role.icon}
            <span className="font-semibold text-xs">{role.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
        >
          Voltar
        </button>
      </div>
    </motion.div>
  );
};

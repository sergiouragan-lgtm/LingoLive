import React from 'react';
import { Calendar, Clock, Target, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export interface LearningActivity {
  id: string;
  title: string;
  date?: string;
  time?: string;
  teacher?: string;
  type?: 'lesson' | 'exercise' | 'practice';
  isLocked?: boolean;
}

type NextActivityWidgetProps = {
  activity?: LearningActivity | null;
  isLoading?: boolean;
  isError?: boolean;
  onNavigate?: () => void;
};

export const NextActivityWidget: React.FC<NextActivityWidgetProps> = ({
  activity,
  isLoading = false,
  isError = false,
  onNavigate,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-200 h-48 w-full rounded-2xl" aria-hidden="true" />
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3 text-rose-600">
        <AlertCircle size={20} />
        <span className="text-sm font-semibold">Erro ao carregar actividade</span>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-2">
        <h3 className="text-base font-bold text-slate-800">Sem actividade pendente</h3>
        <p className="text-xs text-slate-500">Aproveite para revisar os conteúdos anteriores.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Calendar size={16} />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Próxima Actividade
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-800">{activity.title}</h3>
        {activity.date && activity.time && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock size={14} className="text-slate-400" />
            <span>{activity.date} • {activity.time}</span>
          </div>
        )}
        {activity.teacher && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Target size={14} className="text-slate-400" />
            <span>{activity.teacher}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        data-testid="next-activity-button"
        onClick={onNavigate}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
      >
        <span>{activity.isLocked ? 'Ver detalhes' : 'Começar'}</span>
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
};

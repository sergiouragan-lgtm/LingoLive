import React from 'react';
import { Trophy, AlertCircle } from 'lucide-react';

type CurrentLevelWidgetProps = {
  level?: string | null;
  isLoading?: boolean;
  isError?: boolean;
};

export const CurrentLevelWidget: React.FC<CurrentLevelWidgetProps> = ({
  level,
  isLoading = false,
  isError = false,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-200 h-12 w-full rounded-2xl" aria-hidden="true" />
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="text-xs font-semibold text-rose-600">Erro ao carregar nível</div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
          <Trophy size={20} />
        </div>
        <div className="text-xs font-semibold text-slate-500">Avaliação pendente</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Trophy size={20} />
      </div>
      <div className="truncate">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Nível CEFR</div>
        <div className="text-base font-extrabold text-slate-800 truncate">{level}</div>
      </div>
    </div>
  );
};

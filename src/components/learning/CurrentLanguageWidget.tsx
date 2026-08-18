import React from 'react';
import { AlertCircle } from 'lucide-react';

type CurrentLanguageWidgetProps = {
  name?: string | null;
  flag?: string | null;
  isLoading?: boolean;
  isError?: boolean;
};

export const CurrentLanguageWidget: React.FC<CurrentLanguageWidgetProps> = ({
  name,
  flag,
  isLoading = false,
  isError = false,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-200 h-8 w-32 rounded-full" aria-hidden="true" />
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50" role="alert">
        <AlertCircle size={14} />
        <span>Erro</span>
      </div>
    );
  }

  if (!name) {
    return (
      <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
        Idioma não definido
      </div>
    );
  }

  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white flex items-center gap-1.5">
      <span className="text-sm" aria-hidden="true">{flag || '🌐'}</span>
      <span>{name || 'Idioma Ativo'}</span>
    </span>
  );
};

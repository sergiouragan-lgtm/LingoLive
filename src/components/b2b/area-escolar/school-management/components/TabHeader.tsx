import React from 'react';
import { RefreshCw } from 'lucide-react';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  onSync?: () => void;
  isSyncing?: boolean;
  actions?: React.ReactNode;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  title,
  subtitle,
  onSync,
  isSyncing = false,
  actions,
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
    <div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">
      {actions}
      {onSync && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-all text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      )}
    </div>
  </div>
);

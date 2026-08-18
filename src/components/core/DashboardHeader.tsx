import React from 'react';
import { Search, Share2, FileText, Bell, Database, Cloud, RefreshCw, CheckCircle, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { motion } from "motion/react";

interface DashboardHeaderProps {
  studentName: string;
  onShare: () => void;
  onGenerateReport: () => void;
  // Stats
  levelNum: number;
  currentXp: number;
  nextXpThreshold: number;
  progressPercent: number;
  profile?: any;
  syncState?: {
    status: "idle" | "syncing" | "synced" | "offline" | "error";
    lastSyncedAt: string;
    target: "IndexedDB" | "Firestore" | "Both" | "None";
  };
  onForceSync?: () => Promise<void>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({ 
  studentName, 
  onShare, 
  onGenerateReport, 
  levelNum, 
  currentXp, 
  nextXpThreshold, 
  progressPercent, 
  profile,
  syncState,
  onForceSync
}) => {
  const syncStatus = syncState || {
    status: typeof navigator !== "undefined" && navigator.onLine ? "synced" : "offline",
    lastSyncedAt: new Date().toLocaleTimeString(),
    target: "None" as const
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-2 border-b border-slate-100 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Painel de Ações</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <button onClick={onShare} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer">
          <Share2 size={14} />
          <span className="truncate">Compartilhar</span>
        </button>
        <button onClick={onGenerateReport} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer">
          <FileText size={14} />
          <span className="truncate">Relatório</span>
        </button>

        {/* Sync Status Indicator */}
        <button
          onClick={onForceSync}
          disabled={syncStatus.status === "syncing"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
            syncStatus.status === "syncing"
              ? "bg-indigo-50 border-indigo-200 text-indigo-600 animate-pulse"
              : syncStatus.status === "offline"
                ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                : syncStatus.status === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          }`}
          title="Clique para forçar sincronização total (IndexedDB + Firestore)"
        >
          {syncStatus.status === "syncing" ? (
            <RefreshCw size={14} className="animate-spin text-indigo-500" />
          ) : syncStatus.status === "offline" ? (
            <WifiOff size={14} className="text-amber-500" />
          ) : syncStatus.status === "error" ? (
            <AlertCircle size={14} className="text-rose-500" />
          ) : (
            <CheckCircle size={14} className="text-emerald-500" />
          )}
          
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[9px] uppercase tracking-wide leading-none">
              {syncStatus.status === "syncing" 
                ? `Salvando ${syncStatus.target}...` 
                : syncStatus.status === "offline" 
                  ? "Modo Offline" 
                  : syncStatus.status === "error" 
                    ? "Erro de Sinc" 
                    : "Sincronizado"}
            </span>
            <span className="text-[8px] text-slate-500 font-bold leading-none mt-0.5">
              {syncStatus.status === "syncing" ? "Sincronizando" : `Hoje: ${syncStatus.lastSyncedAt}`}
            </span>
          </div>
        </button>
        
        {/* User Stats Display */}
        <div 
          className="flex items-center gap-3 shrink-0 ml-auto md:ml-0 bg-white/60 hover:bg-white/90 border border-slate-100 px-3 py-1.5 rounded-2xl shadow-xs transition-all duration-200"
          title={`Faltam ${nextXpThreshold - currentXp} XP para o nível ${levelNum + 1}`}
        >
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-12" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="16" fill="none" className="stroke-indigo-600" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 16}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progressPercent / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round" transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute w-8.5 h-8.5 rounded-full overflow-hidden border border-white shadow-xs">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=f1f5f9&color=4f46e5&bold=true`} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-md">
              {levelNum}
            </div>
          </div>
          <div className="text-left">
            <div className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">{studentName}</div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider text-[8px]">
                {profile?.level || "A1"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-bold font-mono">
                {currentXp} / {nextXpThreshold} XP
              </span>
            </div>
          </div>
        </div>

        <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 transition cursor-pointer">
          <Bell size={20} />
        </button>
      </div>
    </div>
  );
});
DashboardHeader.displayName = "DashboardHeader";

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastContainerProps {
  toasts: string[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map((toast, i) => (
      <div
        key={i}
        className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-slide-in text-sm max-w-sm"
      >
        <CheckCircle2 className="text-emerald-400 w-5 h-5 flex-shrink-0" />
        <span>{toast}</span>
      </div>
    ))}
  </div>
);

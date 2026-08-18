import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../context/ToastContext';
import { Trophy, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'achievement':
        return {
          borderClass: 'border-amber-200',
          iconBg: 'bg-amber-100 text-amber-600',
          icon: <Trophy className="w-5 h-5" />,
          defaultTitle: 'Nova Conquista!'
        };
      case 'success':
        return {
          borderClass: 'border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600',
          icon: <CheckCircle2 className="w-5 h-5" />,
          defaultTitle: 'Sucesso!'
        };
      case 'error':
        return {
          borderClass: 'border-rose-200',
          iconBg: 'bg-rose-100 text-rose-600',
          icon: <AlertCircle className="w-5 h-5" />,
          defaultTitle: 'Erro'
        };
      case 'info':
      default:
        return {
          borderClass: 'border-indigo-200',
          iconBg: 'bg-indigo-100 text-indigo-600',
          icon: <Info className="w-5 h-5" />,
          defaultTitle: 'Aviso'
        };
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-[400px]">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`bg-white border ${style.borderClass} shadow-lg rounded-2xl p-4 flex items-center gap-3 min-w-[320px]`}
            >
              <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">
                  {toast.title || style.defaultTitle}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap break-words">
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="text-slate-400 hover:text-slate-600 shrink-0 self-start p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

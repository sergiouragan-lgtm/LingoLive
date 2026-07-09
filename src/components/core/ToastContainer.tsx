import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../context/ToastContext';
import { Trophy, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-white border border-amber-200 shadow-lg rounded-2xl p-4 flex items-center gap-3 min-w-[300px]"
          >
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm">Nova Conquista!</p>
              <p className="text-xs text-slate-600">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

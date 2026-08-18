import React from 'react';
import { motion } from 'motion/react';
import { Languages } from 'lucide-react';

interface LoadingFallbackProps {
  title?: string;
  subMessage?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  title = 'LingoLIVE IA', 
  subMessage = 'Iniciando ambiente seguro...' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>
      <div className="text-center space-y-6 relative z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/10"
        >
          <Languages className="w-8 h-8 text-white" />
        </motion.div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">{subMessage}</p>
        </div>
        <div className="w-32 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

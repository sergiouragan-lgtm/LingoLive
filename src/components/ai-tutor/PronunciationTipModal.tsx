import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface PronunciationTipModalProps {
  tip: string;
  onClose: () => void;
}

export const PronunciationTipModal: React.FC<PronunciationTipModalProps> = ({ tip, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Dica de Pronúncia</h3>
          <p className="text-slate-600 text-base">{tip}</p>
          <button 
            onClick={onClose}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

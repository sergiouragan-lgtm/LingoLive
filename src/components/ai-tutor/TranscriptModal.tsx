import React from 'react';
import { TranscriptItem } from '../../types';
import { X } from 'lucide-react';

interface TranscriptModalProps {
  studentName: string;
  transcripts: TranscriptItem[];
  onClose: () => void;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({ studentName, transcripts, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transcrições de {studentName}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {transcripts.length > 0 ? (
            transcripts.map((t) => (
              <div key={t.id} className={`p-3 rounded-lg ${t.role === 'user' ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-100'}`}>
                <p className="text-sm font-semibold">{t.role === 'user' ? 'Aluno' : 'IA'}</p>
                <p className="text-sm">{t.text}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhuma transcrição disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
};

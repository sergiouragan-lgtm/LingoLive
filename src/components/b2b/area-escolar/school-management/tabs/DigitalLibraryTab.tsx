import React from 'react';
import { FileText, Eye, Clock, Award } from 'lucide-react';

interface DigitalLibraryTabProps {
  addToast: (msg: string) => void;
}

export const DigitalLibraryTab: React.FC<DigitalLibraryTabProps> = ({ addToast }) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Biblioteca Digital Multimédia</h2>
        <p className="text-sm text-slate-500">Repositório completo de PDFs, vídeos, exames e recursos preparados por inteligência artificial.</p>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { title: "Manuais & PDFs", count: "148 arquivos", icon: FileText, color: "bg-blue-50 text-blue-600" },
        { title: "Aulas Gravadas (Vídeo)", count: "92 vídeos", icon: Eye, color: "bg-purple-50 text-purple-600" },
        { title: "Áudios & Podcasts", count: "214 ficheiros", icon: Clock, color: "bg-teal-50 text-teal-600" },
        { title: "Flashcards Recomendados", count: "1.250 cards", icon: Award, color: "bg-amber-50 text-amber-600" },
      ].map((item, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className={`p-2 rounded-lg w-fit ${item.color}`}>
            <item.icon size={18} />
          </div>
          <h4 className="font-bold text-slate-800 text-xs mt-3">{item.title}</h4>
          <p className="text-[11px] text-slate-400 mt-1">{item.count}</p>
        </div>
      ))}
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4 text-sm">Biblioteca de Testes & Exames Rápidos</h3>
      <div className="space-y-3">
        {[
          { id: "e1", examName: "Exame de Conversação Avançada (Inglês B2)", createdBy: "Sra. Maria Neto", format: "Exame Geral" },
          { id: "e2", examName: "Avaliação Intermédia de Vocabulário Prático (Francês A2)", createdBy: "LingoLIVE IA", format: "IA Adaptativa" },
          { id: "e3", examName: "Gramática Escrita: Tempos Verbais Complexos (Português C1)", createdBy: "Prof. António Gonga", format: "PDF de Aula" },
        ].map((exam, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-800">{exam.examName}</p>
              <p className="text-[10px] text-slate-400">Criador: {exam.createdBy} | Tipo: {exam.format}</p>
            </div>
            <button
              onClick={() => { addToast(`Preparando arquivo ${exam.examName} para download...`); }}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 rounded-lg text-[10px] font-bold"
            >
              Baixar Recurso
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

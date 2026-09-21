import React from 'react';

interface CommunicationTabProps {
  addToast: (msg: string) => void;
}

export const CommunicationTab: React.FC<CommunicationTabProps> = ({ addToast }) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">Central de Comunicação & Chat Escolar</h2>
      <p className="text-sm text-slate-500">Canais síncronos entre direção, professores, alunos e pais de alunos.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Channels List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Canais de Mensagem</h3>
        <div className="space-y-2 text-xs">
          {[
            { id: "c1", name: "Direção ↔ Professores", unread: 3, lastMsg: "Reunião de notas às 15h" },
            { id: "c2", name: "Professores ↔ Encarregados", unread: 0, lastMsg: "Aline completou o teste" },
            { id: "c3", name: "Comunidade Geral da Escola", unread: 12, lastMsg: "Matrículas abertas para 2027" },
          ].map((ch, idx) => (
            <div key={idx} className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer rounded-xl transition-all border border-slate-100 flex justify-between items-center">
              <div>
                <p className="font-bold">{ch.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{ch.lastMsg}</p>
              </div>
              {ch.unread > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {ch.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Broadcast Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-2">Disparar Comunicado em Lote (Push, Email, WhatsApp)</h3>
          <p className="text-xs text-slate-500 mb-4">Selecione o grupo e envie uma mensagem oficial imediata para toda a comunidade.</p>

          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <button className="py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-lg">
              Apenas Professores
            </button>
            <button className="py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
              Pais & Alunos
            </button>
            <button className="py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
              Escola Completa
            </button>
          </div>

          <textarea
            placeholder="Insira o aviso geral da direção..."
            className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 h-28 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={() => { addToast("Comunicado em lote transmitido com sucesso!"); }}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl mt-4 transition-all"
        >
          Transmitir Comunicado Geral
        </button>
      </div>
    </div>
  </div>
);

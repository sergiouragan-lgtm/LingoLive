import React from 'react';

interface IntegrationsTabProps {
  addToast: (msg: string) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ addToast }) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">Configurações de Integrações Externas</h2>
      <p className="text-sm text-slate-500">Sincronização com sistemas LMS legados (Moodle, Canvas), Google Classroom e ferramentas de chat.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { name: "Google Classroom", desc: "Sincronização de notas de quizzes e listas de alunos de forma transparente.", active: true },
        { name: "WhatsApp Enterprise API", desc: "Disparos de alertas de notas em tempo real e avisos aos pais.", active: false },
        { name: "Microsoft Teams / Zoom", desc: "Aulas ao vivo síncronas integradas e gravadas automaticamente.", active: true },
      ].map((int, idx) => (
        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800 text-sm">{int.name}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${int.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {int.active ? "Ativado" : "Desativado"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{int.desc}</p>
          </div>
          <button
            onClick={() => { addToast(`Integração com ${int.name} foi atualizada!`); }}
            className={`w-full mt-6 py-2 rounded-xl text-xs font-bold transition-all ${int.active ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
          >
            {int.active ? "Configurar Parâmetros" : "Ativar Conexão"}
          </button>
        </div>
      ))}
    </div>
  </div>
);

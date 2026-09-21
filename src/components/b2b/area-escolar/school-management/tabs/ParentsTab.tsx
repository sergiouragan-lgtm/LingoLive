import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ParentsTabProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
  addToast: (msg: string) => void;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({
  onSync,
  isSyncing,
  addToast,
}) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Portal dos Pais & Encarregados</h2>
        <p className="text-sm text-slate-500">Monitoramento familiar, envio automático de boletins e acompanhamento de IA.</p>
      </div>
      <button
        onClick={() => onSync('pais_notif')}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
      >
        <RefreshCw size={14} className={isSyncing === 'pais_notif' ? 'animate-spin' : ''} />
        <span>Sincronizar Notificações Encarregados</span>
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 text-sm">Controle de Sincronização de Progresso com os Pais</h3>
        <div className="space-y-4 text-xs">
          {[
            { parent: "Carlos de Sousa (Pai de Helder)", email: "pai.helder@gmail.com", lastActive: "Ontem às 18:32", alertStatus: "Enviado" },
            { parent: "Sofia Cassinda (Mãe de Aline)", email: "mae.aline@gmail.com", lastActive: "Há 2 dias", alertStatus: "Enviado" },
            { parent: "Avelino Neto (Pai de Emanuel)", email: "avelino.neto@gmail.com", lastActive: "Ativo Agora", alertStatus: "Urgente" },
          ].map((row, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">{row.parent}</p>
                <p className="text-[10px] text-slate-400">{row.email}</p>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${row.alertStatus === "Urgente" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                  Relatório IA: {row.alertStatus}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Sessão: {row.lastActive}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 mb-2 text-sm">Disparar Alerta Pedagógico para Pais</h3>
          <p className="text-xs text-slate-500 mb-4">Selecione uma dificuldade detectada pela IA e envie uma sugestão de reforço doméstico diretamente para o WhatsApp ou Email dos pais.</p>
          <textarea
            placeholder="Ex: Identificamos que o Helder de Sousa está com 10% a menos de aproveitamento em Present Perfect. Recomendamos incentivar o jogo 'Conversa no Aeroporto' no portal do aluno."
            className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 h-28"
          />
        </div>
        <button
          onClick={() => { addToast("Alerta pedagógico enviado com sucesso para os encarregados de educação!"); }}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-4 transition-all"
        >
          Disparar Alerta LingoLIVE
        </button>
      </div>
    </div>
  </div>
);

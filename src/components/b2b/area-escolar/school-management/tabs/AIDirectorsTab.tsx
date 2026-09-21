import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AIDirectorsTabProps {
  selectedGeoRegion: string;
  setSelectedGeoRegion: (region: string) => void;
  selectedAIInsight: string | null;
  setSelectedAIInsight: (insight: string | null) => void;
  addToast: (msg: string) => void;
}

export const AIDirectorsTab: React.FC<AIDirectorsTabProps> = ({
  selectedGeoRegion,
  setSelectedGeoRegion,
  selectedAIInsight,
  setSelectedAIInsight,
  addToast,
}) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">IA Insights (Módulo Direção)</h2>
      <p className="text-sm text-slate-500">Mapeamento preditivo de anomalias, análise de comportamento de estudo e inteligência escolar.</p>
    </div>

    {/* Regional Geolocation Adaptor Banner */}
    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mb-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-xl">
          {selectedGeoRegion === 'Moçambique' ? '🇲🇿' :
           selectedGeoRegion === 'Angola' ? '🇦🇴' :
           selectedGeoRegion === 'Brasil' ? '🇧🇷' :
           selectedGeoRegion === 'Portugal' ? '🇵🇹' : '🌍'}
        </span>
        <span className="font-bold text-slate-700">Mapeamento de IA filtrado para a região activa: <span className="text-indigo-600">{selectedGeoRegion}</span></span>
      </div>
      <div className="flex gap-1">
        {['Moçambique', 'Angola', 'Brasil', 'Portugal'].map((reg) => (
          <button
            key={reg}
            onClick={() => {
              setSelectedGeoRegion(reg);
              addToast(`Insights da Direção adaptados para ${reg}!`);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedGeoRegion === reg ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
          >
            {reg}
          </button>
        ))}
      </div>
    </div>

    {/* Live Alerts Box */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(selectedGeoRegion === 'Moçambique' ? [
        { title: "Moçambique: Alerta de Listening", alert: "Queda de 11% na proficiência média de áudio na região de Maputo. Recomendada adoção de episódios mais curtos de podcasts educativos com vocabulário local.", type: "critico", time: "Hoje" },
        { title: "Comportamento de Estudo em Maputo", alert: "Pico de acesso à IA registado aos sábados de manhã. Elevada afinidade por tarefas práticas de conversação oral.", type: "insight", time: "Ontem" },
        { title: "Risco Pedagógico Regional", alert: "8 alunos em risco pedagógico identificados em Moçambique. Sugerido reforço focado em tempos verbais e preposições.", type: "alerta", time: "Há 2 dias" },
      ] : selectedGeoRegion === 'Angola' ? [
        { title: "Turma 8B: Alerta de Listening", alert: "Queda de 15% na proficiência média de escuta. Aulas recomendadas de audição ativa e semba rítmico.", type: "critico", time: "Hoje" },
        { title: "Comportamento de Estudo em Luanda", alert: "Alunos utilizam a IA preferencialmente às terças-feiras entre as 18:00 e as 21:00. Ponto de carga ótimo.", type: "insight", time: "Ontem" },
        { title: "Alunos em Risco Pedagógico", alert: "12 alunos identificados com declínio de participação em quizzes semanais em Angola. Risco de evasão alto.", type: "alerta", time: "Há 2 dias" },
      ] : selectedGeoRegion === 'Brasil' ? [
        { title: "Brasil: Alerta de Frequência", alert: "Média de assiduidade aos fins de semana recuou 8% devido aos feriados regionais brasileiros. Sugerido reajustar metas de XP semanais.", type: "critico", time: "Hoje" },
        { title: "Comportamento de Estudo SP/RJ", alert: "Preferência expressiva por simulações rápidas no telemóvel durante o horário de almoço corporativo brasileiro (12h-14h).", type: "insight", time: "Ontem" },
        { title: "Metas de Conversação Berrini", alert: "Engajamento excelente de 92% na realização dos roleplays corporativos adaptados ao mercado corporativo de tecnologia.", type: "alerta", time: "Há 2 dias" },
      ] : selectedGeoRegion === 'Portugal' ? [
        { title: "Portugal: Desempenho Erasmus", alert: "Crescimento de 18% no interesse por certificações de proficiência e inglês acadêmico. Elevado rendimento médio geral.", type: "insight", time: "Hoje" },
        { title: "Comportamento de Estudo de Lisboa", alert: "Uso concentrado da plataforma após as 20h portuguesas. Alta taxa de conclusão de vocabulário de turismo e Web Summit.", type: "insight", time: "Ontem" },
        { title: "Risco de Abandono Universitário", alert: "2 alunos sinalizados com baixa assiduidade devido a conflitos de horários em exames nacionais.", type: "alerta", time: "Há 2 dias" },
      ] : [
        { title: "Alerta Geral de Listening", alert: "Análise global indica declínio temporário na prática de audição ativa em todos os polos integrados.", type: "critico", time: "Hoje" },
        { title: "Comportamento de Estudo Geral", alert: "Estudo autónomo consolidado de forma equilibrada ao longo da semana útil, com foco no fim de semana.", type: "insight", time: "Ontem" },
        { title: "Risco Pedagógico Acumulado", alert: "Sinalização de casos urgentes automatizada e enviada para os respectivos coordenadores pedagógicos.", type: "alerta", time: "Há 2 dias" },
      ]).map((item, idx) => (
        <div
          key={idx}
          onClick={() => { setSelectedAIInsight(item.alert); addToast(`Carregando detalhe do insight preditivo.`); }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${
            item.type === "critico"
              ? "bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-900"
              : item.type === "alerta"
              ? "bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-900"
              : "bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-900"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase">{item.time}</span>
              <AlertTriangle size={16} className={item.type === "critico" ? "text-rose-500" : item.type === "alerta" ? "text-amber-500" : "text-indigo-500"} />
            </div>
            <h4 className="font-bold text-xs mb-1.5">{item.title}</h4>
            <p className="text-[11px] opacity-80 leading-relaxed">{item.alert}</p>
          </div>
          <span className="text-[10px] font-bold underline mt-4 block text-right">Ver Plano de Ação sugerido</span>
        </div>
      ))}
    </div>

    {/* Action Plan Drawer */}
    {selectedAIInsight && (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 animate-fade-in">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm">Plano de Ação Proposto pela LingoLIVE IA</h3>
          <button onClick={() => setSelectedAIInsight(null)} className="text-xs text-slate-400 hover:text-slate-600">Fechar</button>
        </div>
        <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <strong>Contexto analisado:</strong> {selectedAIInsight}
        </p>
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-slate-700">Recomendações Práticas Automatizadas:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Disparar Notificação:</strong> Sugerir exercícios de audição no aplicativo móvel dos alunos selecionados.</li>
            <li><strong>Reforço Pedagógico:</strong> Injetar glossário automatizado para os professores usarem na próxima sessão síncrona.</li>
            <li><strong>Contato Automático:</strong> Enviar boletim personalizado aos encarregados de educação via canal integrado.</li>
          </ul>
        </div>
        <button
          onClick={() => { addToast("Plano de Ação executado e disparado para os alunos e professores em risco!"); setSelectedAIInsight(null); }}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
        >
          Executar Plano de Ação LingoLIVE
        </button>
      </div>
    )}
  </div>
);

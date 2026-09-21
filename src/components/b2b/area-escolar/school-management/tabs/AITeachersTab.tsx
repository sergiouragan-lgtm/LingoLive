import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AITeachersTabProps {
  selectedGeoRegion: string;
  setSelectedGeoRegion: (region: string) => void;
  teacherPrompt: string;
  setTeacherPrompt: (prompt: string) => void;
  aiResponse: string | null;
  isGenerating: boolean;
  onSync: () => void;
  addToast: (msg: string) => void;
}

export const AITeachersTab: React.FC<AITeachersTabProps> = ({
  selectedGeoRegion,
  setSelectedGeoRegion,
  teacherPrompt,
  setTeacherPrompt,
  aiResponse,
  isGenerating,
  onSync,
  addToast,
}) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">Assistente Pedagógico de IA (Para Professores)</h2>
      <p className="text-sm text-slate-500">Criação instantânea de exames, exercícios adaptativos, rubricas de avaliação e apoio didático.</p>
    </div>

    {/* Regional Geolocation Adaptor Banner */}
    <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-bounce">
          {selectedGeoRegion === 'Moçambique' ? '🇲🇿' :
           selectedGeoRegion === 'Angola' ? '🇦🇴' :
           selectedGeoRegion === 'Brasil' ? '🇧🇷' :
           selectedGeoRegion === 'Portugal' ? '🇵🇹' : '🌍'}
        </span>
        <div>
          <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Tutor Regional Ativo
          </span>
          <h3 className="text-sm font-extrabold text-white mt-1">
            Sintonizado com: <span className="text-amber-300 font-black">{selectedGeoRegion}</span>
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {[
          { name: 'Moçambique', flag: '🇲🇿' },
          { name: 'Angola', flag: '🇦🇴' },
          { name: 'Brasil', flag: '🇧🇷' },
          { name: 'Portugal', flag: '🇵🇹' }
        ].map((reg) => (
          <button
            key={reg.name}
            onClick={() => {
              setSelectedGeoRegion(reg.name);
              addToast(`Assistente IA reconfigurado para o contexto de ${reg.name}!`);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
              selectedGeoRegion === reg.name
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm scale-105'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{reg.flag}</span>
            <span>{reg.name}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Request Builder */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-sm">O que deseja criar hoje em {selectedGeoRegion}?</h3>
          </div>
          <textarea
            value={teacherPrompt}
            onChange={(e) => setTeacherPrompt(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs h-32 focus:ring-1 focus:ring-indigo-500"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(selectedGeoRegion === 'Moçambique' ? [
              "✔ Exame: Present Perfect (Maputo)",
              "✔ Vocabulário Técnico: Porto de Beira",
              "✔ Diálogo CEFR A2: Fauna da Gorongosa"
            ] : selectedGeoRegion === 'Angola' ? [
              "✔ Exame: Present Perfect (Luanda)",
              "✔ Vocabulário de Negócios (Lubango)",
              "✔ Diálogo CEFR A2: Música Semba"
            ] : selectedGeoRegion === 'Brasil' ? [
              "✔ Diálogo: Inovação em São Paulo",
              "✔ Vocabulário Corporativo Berrini",
              "✔ Prática de Listening em Inglês"
            ] : selectedGeoRegion === 'Portugal' ? [
              "✔ Vocabulário: Turismo em Alfama",
              "✔ Diálogo: Web Summit em Lisboa",
              "✔ Exame CEFR B2 com Acordo Ortográfico"
            ] : [
              "✔ Criar Exame de Gramática",
              "✔ Corrigir Redação (CEFR A2)",
              "✔ Gerar Exercícios de Conversação"
            ]).map((item, idx) => (
              <button
                key={idx}
                onClick={() => setTeacherPrompt(item.substring(2))}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-semibold rounded-lg transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSync}
          disabled={isGenerating}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs mt-6 flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          <Sparkles size={14} />
          <span>{isGenerating ? "Processando Algoritmo de IA..." : "Gerar com LingoLIVE IA"}</span>
        </button>
      </div>

      {/* AI Result View */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase">Resultado do Assistente IA</span>
            {aiResponse && (
              <button
                onClick={() => { navigator.clipboard.writeText(aiResponse); addToast("Copiado para a área de transferência!"); }}
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Copiar Texto
              </button>
            )}
          </div>

          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="animate-spin text-indigo-600" size={32} />
              <span className="text-xs font-medium">Lendo contexto da escola e gerando teste adaptativo...</span>
            </div>
          ) : aiResponse ? (
            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 h-64 overflow-y-auto leading-relaxed">
              {aiResponse}
            </pre>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-4">
              <Sparkles size={36} className="text-slate-300 mb-2" />
              <p className="text-xs">Insira um comando didático no painel ao lado para que a inteligência geradora prepare materiais customizados em segundos.</p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-3">Alimentado por Gemini 1.5 Flash Enterprise - Totalmente alinhado às diretrizes do QECR (CEFR).</p>
      </div>
    </div>
  </div>
);

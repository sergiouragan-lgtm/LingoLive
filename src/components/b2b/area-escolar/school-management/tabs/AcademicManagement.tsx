import React from 'react';
import { RefreshCw } from 'lucide-react';

interface AcademicManagementProps {
  onSync: (section: string) => void;
  isSyncing: string | null;
  activeYear: string;
  setActiveYear: (year: string) => void;
  activePeriod: string;
  setActivePeriod: (period: string) => void;
  addToast: (msg: string) => void;
}

export const AcademicManagement: React.FC<AcademicManagementProps> = ({
  onSync,
  isSyncing,
  activeYear,
  setActiveYear,
  activePeriod,
  setActivePeriod,
  addToast,
}) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestão Académica Central</h2>
        <p className="text-sm text-slate-500">Sincronização integrada do Ano Letivo, Períodos, Horários e Salas.</p>
      </div>
      <button
        onClick={() => onSync('academia')}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
      >
        <RefreshCw size={14} className={isSyncing === 'academia' ? 'animate-spin' : ''} />
        <span>Sincronizar Calendário</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-400 uppercase">Ano Letivo Ativo</label>
        <select
          value={activeYear}
          onChange={(e) => {
            setActiveYear(e.target.value);
            addToast(`Ano letivo alterado para ${e.target.value}`);
          }}
          className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
        >
          <option value="2026">2026 (Ativo)</option>
          <option value="2027">2027 (Planeamento)</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-400 uppercase">Período / Trimestre</label>
        <select
          value={activePeriod}
          onChange={(e) => {
            setActivePeriod(e.target.value);
            addToast(`Período de avaliação alterado para ${e.target.value}`);
          }}
          className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
        >
          <option value="1º Trimestre">1º Trimestre</option>
          <option value="2º Trimestre">2º Trimestre</option>
          <option value="3º Trimestre">3º Trimestre (Atual)</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-400 uppercase">Salas Sincronizadas</label>
        <p className="text-lg font-bold text-slate-800 mt-2">18 Salas Ativas</p>
        <p className="text-[10px] text-slate-400">Blocos A, B e C</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-400 uppercase">Feriados Próximos</label>
        <p className="text-sm font-bold text-rose-600 mt-2">11 de Novembro</p>
        <p className="text-[10px] text-slate-400">Dia da Independência</p>
      </div>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="font-bold text-slate-800 mb-4 text-sm">Estrutura de Horários & Disciplinas Disponíveis</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <th className="p-3">Turno / Horário</th>
              <th className="p-3">Segunda</th>
              <th className="p-3">Terça</th>
              <th className="p-3">Quarta</th>
              <th className="p-3">Quinta</th>
              <th className="p-3">Sexta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            <tr>
              <td className="p-3 bg-slate-50 font-bold">Manhã (08:00 - 10:00)</td>
              <td className="p-3 text-indigo-600">Inglês - 7A (Sala 4)</td>
              <td className="p-3 text-slate-500">História - 8A</td>
              <td className="p-3 text-indigo-600">Inglês - 7A (Sala 4)</td>
              <td className="p-3 text-teal-600">Matemática - 9B</td>
              <td className="p-3 text-emerald-600">Português - 7A</td>
            </tr>
            <tr>
              <td className="p-3 bg-slate-50 font-bold">Manhã (10:30 - 12:30)</td>
              <td className="p-3 text-teal-600">Ciências - 8B</td>
              <td className="p-3 text-purple-600">Francês - 9A (Sala 2)</td>
              <td className="p-3 text-teal-600">Ciências - 8B</td>
              <td className="p-3 text-purple-600">Francês - 9A (Sala 2)</td>
              <td className="p-3 text-indigo-600">Inglês Avançado</td>
            </tr>
            <tr>
              <td className="p-3 bg-slate-50 font-bold">Tarde (13:30 - 15:30)</td>
              <td className="p-3 text-amber-600">Chinês - 8A (Sala 3)</td>
              <td className="p-3 text-slate-500">Informática - 10C</td>
              <td className="p-3 text-amber-600">Chinês - 8A (Sala 3)</td>
              <td className="p-3 text-slate-500">Informática - 10C</td>
              <td className="p-3 text-indigo-600">Inglês Infantil</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

import React from 'react';
import { Download } from 'lucide-react';

interface FinancialTabProps {
  licenseKey: string;
  addToast: (msg: string) => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({ licenseKey, addToast }) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">Gestão Financeira & Licenças</h2>
      <p className="text-sm text-slate-500">Faturamento anual corporativo, controle de mensalidades integradas e upgrade de licença de uso.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Billing Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faturamento de Matrículas (Mês Corrente)</span>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">12.840.000 AOA</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">↑ 12% em relação ao trimestre passado</p>
        </div>
        <button
          onClick={() => { addToast("Relatório financeiro mensal baixado!"); }}
          className="w-full mt-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Download size={14} />
          <span>Baixar Relatório Mensal</span>
        </button>
      </div>

      {/* Subscriptions Progress */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Adimplência de Mensalidades</span>
          <h3 className="text-xl font-bold text-slate-800 mt-2">96.5% Pago</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '96.5%' }} />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4">Apenas 3.5% em atraso. Cobrança automática ativa via WhatsApp.</p>
      </div>

      {/* License Information */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chave da Licença LingoLIVE</span>
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">Ativa</span>
          </div>
          <p className="text-md font-bold text-amber-400 mt-2">{licenseKey}</p>
          <p className="text-[10px] text-slate-400 mt-1">Nível: Premium Enterprise Unlimited</p>
        </div>
        <button
          onClick={() => { addToast("Chave da licença revalidada com o servidor!"); }}
          className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
        >
          Renovar / Validar Chave de Acesso
        </button>
      </div>
    </div>
  </div>
);

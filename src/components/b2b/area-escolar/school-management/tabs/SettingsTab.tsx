import React from 'react';

interface SettingsTabProps {
  addToast: (msg: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ addToast }) => (
  <div className="space-y-6">
    <div className="pb-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">Configurações Gerais do Hub</h2>
      <p className="text-sm text-slate-500">Parâmetros globais, idioma padrão da plataforma e segurança do perfil.</p>
    </div>

    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-xs space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-bold text-slate-600">Nome Oficial da Escola</label>
          <input type="text" defaultValue="Colégio LingoLIVE Luanda" className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="font-bold text-slate-600">Email Administrativo</label>
          <input type="text" defaultValue="geral@col-lingolive.ao" className="w-full mt-2 p-2 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={() => addToast("Configurações atualizadas e salvas com sucesso!")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  </div>
);

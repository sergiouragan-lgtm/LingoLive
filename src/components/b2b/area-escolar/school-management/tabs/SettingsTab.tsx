import React from 'react';
import { TabHeader } from '../components';

export const SettingsTab: React.FC = () => (
  <div className="space-y-6">
    <TabHeader
      title="Configurações Gerais do Hub"
      subtitle="Parâmetros globais, idioma padrão da plataforma e segurança do perfil."
    />
  </div>
);

import React from 'react';
import { TabHeader } from '../components';

export const IntegrationsTab: React.FC = () => (
  <div className="space-y-6">
    <TabHeader
      title="Configurações de Integrações Externas"
      subtitle="Sincronização com sistemas LMS legados (Moodle, Canvas), Google Classroom e ferramentas de chat."
    />
  </div>
);

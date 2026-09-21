import React from 'react';
import { TabHeader } from '../components';

export const TeachersTab: React.FC = () => (
  <div className="space-y-6">
    <TabHeader
      title="Perfis de Professores"
      subtitle="Gestão de carga horária, departamentos e sincronização com calendários."
    />
  </div>
);

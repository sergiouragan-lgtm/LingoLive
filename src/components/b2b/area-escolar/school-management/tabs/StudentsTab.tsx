import React from 'react';
import { TabHeader } from '../components';

export const StudentsTab: React.FC = () => (
  <div className="space-y-6">
    <TabHeader
      title="Portal Académico de Alunos"
      subtitle="Lista geral de alunos ativos, turmas, progressos de XP e certificados sincronizados."
    />
  </div>
);

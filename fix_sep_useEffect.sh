sed -i "s/import React, { useState } from 'react';/import React, { useState, useEffect } from 'react';/g" src/components/b2b/area-escolar/SchoolEnterprisePlatform.tsx
sed -i "/const \[activeSection, setActiveSection\] = useState<SEPSection>('dashboard');/a \\
\\
  useEffect(() => {\\
    if (activeView === 'dashboard' || activeView === 'school-management' || activeView === 'area-escolar-b2b') setActiveSection('dashboard');\\
    else if (activeView === 'alunos') setActiveSection('students');\\
    else if (activeView === 'professores') setActiveSection('teachers');\\
    else if (activeView === 'turmas' || activeView === 'salas' || activeView === 'horarios' || activeView === 'disciplinas' || activeView === 'certificados' || activeView === 'biblioteca') setActiveSection('classes');\\
    else if (activeView === 'frequencia' || activeView === 'analytics') setActiveSection('analytics');\\
    else if (activeView === 'financeiro') setActiveSection('financial');\\
    else if (activeView === 'ia-escolar') setActiveSection('command-center');\\
    else if (activeView === 'configuracoes-escola') setActiveSection('security');\\
  }, [activeView]);" src/components/b2b/area-escolar/SchoolEnterprisePlatform.tsx

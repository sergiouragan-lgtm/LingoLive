export type CurriculumType = 'National' | 'IB' | 'Cambridge' | 'Pearson';

export interface CurriculumNode {
  id: string;
  type: CurriculumType;
  title: string;
  competencyId: string;
  dependencies: string[]; // IDs dos pré-requisitos (DAG edges)
  isCompleted: boolean;
}

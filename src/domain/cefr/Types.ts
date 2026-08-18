export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LearningObjective {
  id: string;
  skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Writing' | 'Listening' | 'Speaking';
  description: string;
  level: CefrLevel;
}

export interface AssessmentRubric {
  level: CefrLevel;
  minScore: number;
  maxScore: number;
  expectedComplexity: number; // 1-10
}

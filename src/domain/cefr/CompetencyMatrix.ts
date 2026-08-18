import { CefrLevel, LearningObjective } from "./Types";

export const CompetencyMatrix: Record<CefrLevel, LearningObjective[]> = {
  A1: [{ id: 'A1-VOC-1', skill: 'Vocabulary', description: 'Basic personal information', level: 'A1' }],
  A2: [{ id: 'A2-VOC-1', skill: 'Vocabulary', description: 'Daily activities', level: 'A2' }],
  B1: [{ id: 'B1-VOC-1', skill: 'Vocabulary', description: 'Expressing opinions and plans', level: 'B1' }],
  B2: [{ id: 'B2-VOC-1', skill: 'Vocabulary', description: 'Complex abstract topics', level: 'B2' }],
  C1: [{ id: 'C1-VOC-1', skill: 'Vocabulary', description: 'Academic and professional topics', level: 'C1' }],
  C2: [{ id: 'C2-VOC-1', skill: 'Vocabulary', description: 'Nuanced expert communication', level: 'C2' }],
};

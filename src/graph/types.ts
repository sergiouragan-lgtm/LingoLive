import { Attribute } from '../profile/types';

export type NodeType = 
  | 'User' | 'Student' | 'Teacher' | 'Course' | 'Lesson' 
  | 'Skill' | 'Topic' | 'Assessment' | 'Certificate'
  | 'Vocabulary' | 'GrammarRule' | 'Achievement' | 'MarketplaceProduct';

export interface GraphNode {
  id: string;
  type: NodeType;
  data: Record<string, any>;
  createdAt: string;
}

export type EdgeType = 
  | 'Learns' | 'Teaches' | 'Completed' | 'Started' 
  | 'Recommended' | 'BelongsTo' | 'PrerequisiteOf' | 'DependsOn'
  | 'Influences' | 'ValidatedBy' | 'CertifiedBy';

export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  metadata: Record<string, any>;
  createdAt: string;
}

import { CurriculumNode } from "../../domain/curriculum/CurriculumNode";

export class CurriculumEngine {
  // Verifica se um nó pode ser liberado com base nas dependências
  static canUnlockNode(node: CurriculumNode, completedNodes: string[]): boolean {
    return node.dependencies.every(depId => completedNodes.includes(depId));
  }

  // Calcula progresso total de uma trilha
  static calculateProgress(nodes: CurriculumNode[]): number {
    const completed = nodes.filter(n => n.isCompleted).length;
    return (completed / nodes.length) * 100;
  }
}

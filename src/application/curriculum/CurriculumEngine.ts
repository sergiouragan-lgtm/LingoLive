import { CurriculumNode } from "../../domain/curriculum/CurriculumNode";

export class CurriculumEngine {
  // Verifica se um nó pode ser liberado com base nas dependências
  static canUnlockNode(node: CurriculumNode, completedNodes: string[]): boolean {
    return node.dependencies.every(depId => completedNodes.includes(depId));
  }

  // Calcula progresso total de uma trilha
  static calculateProgress(nodes: CurriculumNode[]): number {
    if (nodes.length === 0) return 0;
    const completed = nodes.filter(n => n.isCompleted).length;
    return (completed / nodes.length) * 100;
  }

  static validateAcyclic(nodes: CurriculumNode[]): boolean {
    const graph = new Map(nodes.map(node => [node.id, node.dependencies]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string): boolean => {
      if (visiting.has(id)) return false;
      if (visited.has(id)) return true;
      visiting.add(id);
      for (const dependency of graph.get(id) ?? []) {
        if (graph.has(dependency) && !visit(dependency)) return false;
      }
      visiting.delete(id);
      visited.add(id);
      return true;
    };
    return nodes.every(node => visit(node.id));
  }

  static getUnlockedNodes(nodes: CurriculumNode[]): CurriculumNode[] {
    const completed = nodes.filter(node => node.isCompleted).map(node => node.id);
    return nodes.filter(node => !node.isCompleted && this.canUnlockNode(node, completed));
  }
}

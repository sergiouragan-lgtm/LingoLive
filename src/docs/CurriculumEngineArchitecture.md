# Curriculum Engine Architecture

## 1. Estrutura de Dados (DAG)
O currículo é armazenado como um Grafo Acíclico Dirigido, onde cada `CurriculumNode` define suas dependências.

## 2. Motor de Progresso
O `CurriculumEngine` utiliza a lista de `completedNodes` do aluno para calcular, em tempo real, quais novos nós podem ser desbloqueados (`canUnlockNode`).

## 3. Escalabilidade
- **Leitura**: O grafo é estruturado para consultas rápidas de dependência.
- **Adaptação**: O motor suporta múltiplos tipos de currículos (`IB`, `Cambridge`, `National`) através do campo `type` no nó.

## 4. Auditoria
O `Software Auditor` deve implementar verificações cíclicas para impedir que dependências como `A->B` e `B->A` sejam persistidas, garantindo a integridade do grafo.

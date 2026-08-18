# LingoLIVE Enterprise AI Orchestration Layer

Este repositório contém a arquitetura central de orquestração de Inteligência Artificial para o ecossistema **LingoLIVE Enterprise**.

---

## 🏗️ Visão Geral da Arquitetura

O **LingoLIVE Enterprise AI Orchestrator** coordena e simplifica o consumo de múltiplos provedores de inteligência artificial (como Google Gemini, Vertex AI e OpenAI) por meio de um barramento de IA desacoplado e altamente resiliente. Ele é estruturado usando princípios de **Injeção de Dependências (IoC Container)** e **Desacoplamento de Provedores**.

```
                           +---------------------------+
                           |   API Router / Express    |
                           +-------------+-------------+
                                         |
                                         v
                         +---------------+---------------+
                         |   AIOrchestratorService       |
                         +---------------+---------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
+--------+--------+            +--------+--------+            +--------+--------+
| Prompt Manager  |            | Model Selector  |            | Safety Layer    |
+-----------------+            +-----------------+            +-----------------+
| Versioning &    |            | Dynamic Cost &  |            | PII Filtering & |
| Variable Interp |            | Size Routing    |            | Child Guardrails|
+-----------------+            +-----------------+            +-----------------+
         |                               |                               |
         +-------------------------------+-------------------------------+
                                         |
                                         v
                      +------------------+------------------+
                      |   AI Provider Abstraction Layer     |
                      +------------------+------------------+
                                         |
               +-------------------------+-------------------------+
               |                         |                         |
               v                         v                         v
     +---------+---------+     +---------+---------+     +---------+---------+
     | GoogleGenAIProvider |    |   OpenAIProvider  |     |  VertexAIProvider |
     +---------------------+     +-------------------+     +-------------------+
```

---

## 🛠️ Recursos Implementados

1. **Abstração de Provedores (IProvider)**: Hot-swap simplificado de backends de IA.
2. **Estratégia de Retry & Backoff**: Tentativas exponenciais automáticas caso o provedor primário apresente timeout ou rate limit.
3. **Plano de Contingência de Desastres (Fallback)**: Transição automática para provedores alternativos caso o principal fique offline.
4. **Gerenciador de Prompts**: Versionamento nativo de templates e substituição de variáveis com segurança contra injeções.
5. **Contexto Unificado (ContextManager)**: Unifica automaticamente o nível CEFR (A1-C2), idade do utilizador (restrição para crianças de 5-12 anos), objetivos de aprendizado, e regras da escola de idiomas contratante.
6. **Filtro de Segurança e Moderação**: Detecção em tempo real de termos ofensivos, obscenidades, e remoção automática de dados pessoais (PII) como e-mails e cartões de crédito.
7. **Rastreamento de Custos e Auditoria**: Registro de tokens e milissegundos consumidos no banco de dados Firestore para relatórios financeiros corporativos.
8. **Injeção de Dependências (IoC Container)**: Todo o ecossistema é acoplado de forma fraca, ideal para modularidade e testes unitários facilitados.

---

## ⚙️ Configuração

A parametrização do barramento de IA é centralizada em `/server/services/ai/orchestration/config/AIConfig.ts`:

- `providers`: Ativação e configuração de pesos/keys por provedor.
- `models`: Mapeamento de modelos rápidos (Flash/Lite) e complexos (GPT-4o).
- `rateLimits`: Limitação de chamadas por minuto por aluno.
- `safety`: Palavras sensíveis bloqueadas e políticas de segurança infantil.

---

## 🧪 Como Executar os Testes de Verificação

A arquitetura inclui um conjunto de validação autônomo. Para executá-lo a partir de qualquer endpoint de debug ou script de desenvolvimento:

```ts
import { runAIOrchestrationSuite } from "./server/services/ai/orchestration/tests/AIOrchestration.test";

const testResults = await runAIOrchestrationSuite();
console.log(testResults);
```

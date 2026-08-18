# Especificação da Arquitetura Monorepo (LingoLIVE IA)

Este documento especifica a estrutura organizacional de grande escala planejada para o ecossistema do **LingoLIVE IA**, mapeando a migração segura e incremental do código que atualmente reside na raiz (`src/` e `server/`) para o modelo Monorepo.

---

## 1. Organização do Monorepo

O monorepo utiliza o conceito de workspaces (gerenciado via **pnpm**, **yarn workspaces** ou **npm workspaces**) para gerenciar múltiplos pacotes e aplicações de forma integrada e otimizada.

```
lingolive-ia/
├── apps/
│   ├── web/            # Aplicativo principal do estudante (B2C React + Vite)
│   ├── admin/          # Painel do Administrador (Gestão de chaves, tokens e auditoria)
│   ├── school/         # Portal Escola (Professores, turmas e avaliações)
│   └── corporate/      # Portal Corporativo (RHs, colaboradores e análises B2B)
│
├── packages/
│   ├── ui/             # Componentes visuais atômicos compartilhados e animações
│   ├── design-system/  # Tokens de design, fontes e esquemas de cores
│   ├── localization/   # Tradução, suporte multimidioma e regionalismos
│   ├── ai-core/        # Serviços, orquestradores e prompts de IA (Gemini/OpenAI)
│   ├── shared/         # Tipagens TypeScript estruturadas, modelos e DDLs
│   ├── config/         # Arquivos padrão de linting, tsconfig e bundlers
│   ├── utils/          # Helpers genéricos, indexedDB, som, tela cheia
│   ├── analytics/      # Gráficos (D3/Recharts) e progresso pedagógico
│   ├── auth/           # Integração completa de autenticação Firebase Auth e papéis
│   ├── profile/        # Gestão de perfis e preferências individuais do estudante
│   ├── notifications/  # Disparos de lembretes, e-mails e web push
│   ├── payments/       # Integração com Stripe / Multicaixa Express e assinaturas
│   └── testing/        # Mocks globais e infraestrutura de testes unitários
│
├── firebase/           # Configurações do Firebase, firestore.rules e indexes
├── functions/          # Cloud Functions e Webhooks assíncronos em nuvem
├── docs/               # Documentação técnica e relatórios de conformidade
├── scripts/            # Scripts de automação, CI/CD e rotinas de build
├── infrastructure/     # Arquivos Terraform, Docker e provisionamento Cloud Run
└── tools/              # Seeds de banco de dados, utilitários locais e analisadores
```

---

## 2. Mapa de Migração Incremental (De: Raiz -> Para: Monorepo)

Para evitar quebras no build de produção ou no servidor de desenvolvimento local, a migração será realizada componente a componente seguindo a prioridade abaixo:

### Passo 1: Pacote de Tipagens (`packages/shared`)
- **Origem:** `/src/types.ts`
- **Destino:** `/packages/shared/src/index.ts`
- **Ação:** Centralizar as interfaces como `UserRole`, `SavedWord`, `Voice`, `Localization` e os tipos de banco de dados para que todos os outros pacotes e apps os importem como `@lingolive/shared`.

### Passo 2: Pacote de Configurações de Design e UI (`packages/design-system` & `packages/ui`)
- **Origem:** Estilos de Tailwind de `/src/index.css` e componentes atômicos em `/src/components/` (como botões, inputs e layouts puros).
- **Destino:** `/packages/design-system` (tokens e fontes) e `/packages/ui` (componentes do visual).

### Passo 3: Pacote de IA (`packages/ai-core`)
- **Origem:** Orquestradores de IA em `/server/aiOrchestrator.ts`, `/server/openaiOrchestrator.ts` e serviços relacionados à orquestração e fallback para o Gemini e ChatGPT 4.
- **Destino:** `/packages/ai-core/src/`

### Passo 4: Migração das Aplicações (`apps/`)
- **Origem:** As views principais de navegação em `/src/App.tsx`, as views específicas em `/src/components/ai-tutor/` (ex: `LiveChatAluno`, `AIAssistant`) e as lógicas de rota em `/server/routes/`.
- **Destino:** 
  - `apps/web/`: Para o fluxo do aluno.
  - `apps/admin/`: Para o painel de administração (onde as chaves de API são configuradas).

---

## 3. Diretivas Importantes de Desenvolvimento

1. **Adesão às Regras `AGENTS.md`:**
   - Nunca remova ou quebre funcionalidades existentes em produção durante as refatorações.
   - Preserve os fluxos de onboarding, autenticação, pagamentos locais e salvamento offline (IndexedDB).

2. **Segurança de API Keys:**
   - Todas as chaves sensíveis de nuvem (como `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) devem permanecer seguras no lado do servidor.
   - Nenhuma aplicação client-side (`apps/web`) deve importar chaves de API secretas diretamente; elas devem sempre passar pelo proxy do backend de orquestração.

# Inventário de simulações alcançáveis em runtime

Auditoria de 2026-09-04 sobre `src/`, `server/`, `firebase/`, `apps/` e
`packages/`, excluindo testes. “Produção” significa código incluído ou
alcançável no artefacto/runtime, não prova de que a respetiva tela está
publicamente habilitada.

## P0 — afeta autenticação, pagamento ou integridade pedagógica

| Local | Comportamento atual | Risco / decisão |
|---|---|---|
| `src/components/auth/AuthScreen.tsx:336-592` | Novos utilizadores recebem `subscriptionActive: true`; um e-mail hardcoded pode selecionar papel Admin no cliente. | Não tratar como autoridade. As regras agora bloqueiam privilégios/assinatura; mover atribuição de papel e trial para backend/claims. |
| `src/components/growth/PaymentOnboardingScreen.tsx:162-306` | Cartão/transferência têm caminhos de simulação e gravam estado pago/ativo em cache e payload cliente. | A confirmação deve vir apenas de webhook/backend. Manter UI pendente até prova server-side. |
| `src/components/learning/StudentPortal.tsx:132-378` | Registos adaptativos e exame são mock; submissão termina com nota fixa 88. | Não persistir nem exibir como avaliação real. Substituir por scoring do backend. |
| `src/components/learning/KidsInteractiveHub.tsx:186-228` | Falha/bloqueio do reconhecimento de voz executa `simulateSuccess()`. | Pode atribuir sucesso pedagógico sem evidência. Fallback deve ser “não avaliado”. |
| `src/components/learning/LearningPath.tsx:116-129` | Erros gramaticais simulados alimentam atividade quando faltam dados reais. | Identificar visualmente conteúdo de demonstração e impedir métricas reais. |
| `server/middleware/requireAuth.ts:12-32` | Sandbox opcional cria `sandbox-demo-user` com `super_admin`. | Está protegido por duas flags; CI/deploy deve manter `NODE_ENV=production` e nunca ativar a flag com dados reais. |

## P1 — dashboards podem apresentar dados fictícios como reais

| Local | Comportamento atual |
|---|---|
| `src/components/core/SecurityDashboard.tsx:57-285` | Ameaças, rotação KMS e logs são simulados; na ausência de dados, logs demo podem ser enviados ao Firestore. |
| `src/components/core/BackupDashboard.tsx:39-125` | Backups demo, PITR e disaster drills simulados. |
| `src/components/core/FeatureFlagDashboard.tsx:50-337` | Estatísticas e flags default simuladas; avaliação é local. |
| `src/components/core/GlobalDeploymentDashboard.tsx:71-266` | Failover/Anycast apenas simulados. |
| `src/components/core/AICostOptimizationDashboard.tsx:88` | Compressão de prompt é uma heurística simulada. |
| `src/components/core/TestAutomationDashboard.tsx:56-180` | Load/stress tests e jitter são simulações de interface. |
| `src/components/b2b/area-escolar/WorldMapVisualization.tsx:23` | Distribuição geográfica inteira é mock. |
| `src/components/b2b/area-escolar/SchoolManagement.tsx:102-139` | Geolocalização e sincronização usam simulação. |
| `src/components/b2b/area-pais/ParentPortal.tsx:196-296` | Fallback offline, exportação, inclusão de filho e analytics usam dados/ações mock. |
| `src/components/learning/LearningAnalyticsPlatform.tsx:164-434` | Insight e agregação têm fallback/simulação de alta fidelidade. |
| `src/components/learning/RankingModule.tsx:55` | Recompensa usa simulação direta do serviço. |
| `src/components/core/AdminQRScanner.tsx:19-164` | Inclui chaves demo e scanner simulado. |

## P2 — demonstração explícita ou conteúdo de apresentação

- `src/App.tsx:767-780,1499-1519` e
  `src/components/core/UserProfile.tsx:155-175`: conversas iniciais
  hardcoded.
- `src/components/ai-tutor/conversacao/PracticeRoom.tsx:1775-1787`:
  representação visual simulada de chamada.
- `src/components/b2b/area-escolar/CreatorAndProfessorViews.tsx:2393`:
  waveform falsa.
- `src/components/core/Dashboard.tsx:1835-1842`: controlos manuais de
  simulação.
- `src/components/core/onboarding/IntelligentProfile.tsx:8`: criação de
  perfil apresentada como simulação.

## Política de saída

1. Nenhum item P0 pode alterar pagamento, papel, nota, progresso ou recompensa.
2. P1 deve receber badge `Demonstração` e feature flag desligada por padrão
   até existir integração real.
3. Fallback técnico nunca pode produzir “sucesso” pedagógico ou financeiro.
4. Dados demo não podem ser escritos nas coleções canónicas de produção.
5. Cada remoção futura deve adicionar teste que falhe se o fallback simulado
   regressar.


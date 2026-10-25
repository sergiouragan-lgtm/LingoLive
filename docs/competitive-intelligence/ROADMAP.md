# Roadmap cumulativo — LingoLive-IA

**Última atualização:** 2026-10-25
**Baseline:** `main@92c896e7c41c`
**Política:** preservar decisões anteriores; não duplicar PRs abertos; implementar apenas após testes e aprovação.

> Este ficheiro não existia no `main` consultado. Os IDs EC-13–EC-18 preservam decisões anteriormente registadas na conversa; não são commits anteriores do repositório.

## Carteira de evolução competitiva

| ID | Decisão | Prioridade | Estado | Gate |
|---|---|---|---|---|
| EC-13 | Memória pedagógica e repetição espaçada | Alta | Em carteira | Inspecionar PR #53 antes de implementar; medir recuperação 1/7/30 dias |
| EC-14 | Certificação de paridade por idioma, variante e faixa etária | Alta | Em carteira | Dataset autorizado, rubrica e benchmark |
| EC-15 | QA competitivo e regressivo semanal | Média-alta | Em carteira | CI, fixtures estáveis e artefactos |
| EC-16 | Trilhas de Vida GeoAdaptativas | Alta | Em carteira | Perfil Inteligente + Motor GeoLinguístico; evitar duplicar trilhas |
| EC-17 | Motor auditável de preços, moeda e campanhas locais | Alta | Em carteira | Política comercial por país e testes sem transações reais |
| EC-18 | Benchmark de voz, correção e adequação por idade/variante | Alta | Em carteira | Corpus autorizado, consentimento, ASR/latência/falsas correções |
| EC-19 | Métrica de transferência para situações reais | Alta | Novo em 2026-10-10 | Avaliação pré/pós contextual |
| EC-20 | Memória de voz consentida entre sessões | Alta | Novo em 2026-10-25 | Decisão do PR #53, retenção mínima, controlo do utilizador |
| EC-21 | Recuperação activa multimodal de erros | Alta | Novo em 2026-10-25 | EC-13; retenção medida em 1/7/30 dias |
| EC-22 | Catálogo versionado de contrastes regionais | Alta | Novo em 2026-10-25 | Corpus autorizado e revisão linguística pt-AO/pt-BR/pt-PT |
| EC-23 | SLO público e readiness por dependência | Média-alta | Novo em 2026-10-25 | Boot sem falha opaca, liveness/readiness e alertas |

## Qualidade e segurança

| ID | Item | Prioridade | Estado | Critério de fecho |
|---|---|---|---|---|
| CI-E2E-01 | Alinhar Playwright com a porta do servidor, iniciar servidor automaticamente e ligar E2E ao CI/deploy gate | Alta | Bloqueado: alteração executável não aplicada neste ciclo | Fluxos principais e responsividade passam; traces/screenshots/vídeos em falha |
| CI-INT-01 | Executar testes de integração explicitamente no CI | Alta | Pendente | Job de integração obrigatório para promoção |
| SEC-01 | Confirmar visibilidade e autorização das coleções de perfil/escola/professor | Alta até clarificação | Pendente, sem exploração | Matriz de papéis aprovada + testes Firestore de permitido/negado |
| SEC-02 | Validar IP e confiança de proxy na deteção geográfica | Média | Pendente | Cabeçalhos de proxy confiável e falha graciosa testados |
| SEC-03 | Separar liveness/readiness do health check | Média | Pendente | Liveness não declara dependências saudáveis sem verificação |
| SEC-04 | Migrar chave de serviço para Workload Identity Federation | Alta | Pendente; requer configuração cloud | Deploy sem chave longa e IAM mínimo |
| SEC-05 | Definir política de bloqueio Snyk/dependências | Média-alta | Pendente | Severidades, exceções e prazos aprovados |
| SEC-06 | Rever exceções fatais e encerramento gracioso | Média | Pendente | Testes de falha e recuperação passam |
| DEP-01 | Validar PR #58 por grupos de dependências | Alta | Pendente | Lint, typecheck, unit, integração, Playwright, pagamentos/voz e build passam |
| SEC-07 | Remover credencial e autorização administrativa do cliente | Crítica | Pendente; não expor o valor | Custom claims verificadas no servidor + testes de papéis |
| SEC-08 | Substituir guardas Bearer superficiais em cinco grupos de rotas | Crítica | Pendente | Firebase token + ownership/roles; 401/403/IDOR testados |
| SEC-09 | Tornar preview Markdown de e-book seguro contra XSS | Alta | Seleccionado para PR separado | Renderer escapa HTML antes da formatação + regressões |
| SEC-10 | Reduzir limite JSON global de 50 MB | Alta | Pendente | Limites por rota e testes 413 |
| SEC-11 | Remover `unsafe-inline` de scripts CSP | Alta | Pendente | Nonce/hash e E2E sem regressão |
| SEC-12 | Resolver 15 alertas npm sem upgrade forçado | Crítica | Pendente; coordenar PR #64 | 0 crítica/alta ou excepção aprovada |
| SEC-13 | Validar bucket e readiness no boot | Alta | Pendente | Servidor não cai opacamente e health reflecte dependência |

## Não duplicação e preservação

- PR #53 é a referência para sessões conversacionais contínuas/VoiceProvider; não duplicar sem decisão sobre o PR.
- PR #35 é a referência para hardening e perfis infantis/adolescentes; não presumir que está em `main`.
- PR #64 contém 33 atualizações, incluindo majors; não integrar sem matriz de compatibilidade. A referência anterior ao PR #58 fica preservada como histórico do ciclo de 10/10.
- PI1, PI2, Perfil Inteligente, rotas e dashboards aprovados não devem ser substituídos por itens desta carteira.
- Nenhum item autoriza automaticamente mudanças de código, preços, credenciais, infraestrutura ou deploy.

## Histórico — 2026-10-10

- Mantido o grupo-base de sete concorrentes; acrescentados Memrise, Preply e italki.
- Registados EC-19, CI-E2E-01, CI-INT-01 e SEC-01–06.
- Identificada divergência entre porta padrão do servidor (3000) e baseURL Playwright (5173), além da ausência de job E2E no workflow observado.
- Nenhum código funcional, Firestore Rules, pipeline ou deploy foi alterado neste ciclo.

## Histórico — 2026-10-25

- Mantido o grupo-base de dez concorrentes.
- Registados EC-20–EC-23 e SEC-07–SEC-13.
- Implementado e testado o ciclo de correcção explicável do Tutor, sem migração de dados.
- Playwright produziu traces, mas o browser estava ausente e o download bloqueado; promoção impedida.
- Identificados 15 alertas de dependências; nenhuma actualização forçada foi aplicada devido ao PR #64 e ao risco de majors.

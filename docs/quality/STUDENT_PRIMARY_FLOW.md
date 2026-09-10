# Referência de qualidade — fluxo principal do aluno

## Fluxo homologado

`Login → Onboarding → Dashboard → Tutor IA → Feedback → Progresso`

O Perfil Inteligente (`intelligentProfiles/{uid}`) é a fonte inicial do Dashboard e do contexto pedagógico do Tutor. Pagamento e subscrição continuam sob responsabilidade exclusiva dos respetivos portões do fluxo central.

## Matriz de validação

| Área | Evidência automatizada | Critério |
| --- | --- | --- |
| Login e sessão expirada | `CentralEntryController.test.ts` e `studentPrimaryFlow.validation.test.ts` | sessão ausente bloqueia no portão `SESSION` |
| Onboarding | `onboardingCompletionBoundary.test.ts` e `studentOnboardingCompletion.test.ts` | consolida o perfil sem fabricar pagamento/subscrição |
| Dashboard | `StudentDashboardExperience.test.tsx` | Perfil Inteligente prioritário; sucesso, loading, vazio, parcial, indisponível e offline |
| Tutor IA | `PracticeRoomRedesign.test.ts` e testes de `features/tutor` | contexto pedagógico, fallback seguro, adulto/criança e controlos acessíveis |
| Feedback | `FeedbackReportCard.test.tsx` | loading e erro anunciados por tecnologias assistivas |
| Progresso | testes `dashboard*.test.tsx` | objetivo, sequência, tempo, idioma, nível e gamificação |
| Permissões | `routeRegistry.test.ts` e `studentPrimaryFlow.validation.test.ts` | rotas autenticadas protegidas; estudante sem acesso administrativo |
| Rede | `StudentDashboardExperience.test.tsx` e loaders | perda/retorno de ligação anunciados; erro de rede não fabrica dados |

## Critérios de interface

- Desktop: 1440 × 1000.
- Mobile: 390 × 844.
- Zoom: 200%, sem sobreposição ou scroll horizontal no fluxo validado.
- Teclado: skip link, foco visível e ações principais implementadas como elementos nativos.
- Leitor de ecrã: landmarks, nomes acessíveis e regiões `status`/`alert` verificadas no DOM.
- Ligação lenta: skeleton persistente e conteúdo sem layout quebrado.
- Dados vazios: ação para concluir o Perfil Inteligente.
- Utilizador infantil: `Infancy`, `Kids` e `PreTeens` preservam experiências adequadas.
- Utilizador adulto: idade igual ou superior a 18 anos resolve para `ADULT`.

## Regra de regressão

Qualquer módulo migrado deve reutilizar os mesmos contratos de entrada, estados assíncronos, navegação, acessibilidade e diferenciação etária antes de ser considerado concluído.

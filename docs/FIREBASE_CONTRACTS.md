# Contratos atuais do Firebase

Estado auditado em 2026-09-04. Este documento descreve o comportamento que
existe no repositório; não é uma proposta de migração.

## Fontes canónicas

- `firebase.json` seleciona `firestore.rules` na raiz e o inventário
  `firebase/indexes/firestore.indexes.json`.
- `firebase/rules/firestore.rules` não é carregado por `firebase.json` e
  diverge materialmente das regras canónicas. É um artefacto legado, não uma
  fonte segura para deploy.
- O emulador iniciou em edição Standard. A edição da instância remota não pôde
  ser confirmada: a credencial local recebeu HTTP 403 para o projeto
  `default`. Nenhuma alteração remota foi tentada.

## Identidade e autoridade

- A identidade cliente é o `request.auth.uid` emitido por Firebase Auth.
- O documento `/admins/{uid}` e claims administrativas aceites por
  `isAdmin()` constituem a autoridade administrativa das regras atuais.
- O backend usa Firebase Admin SDK e, por desenho, não é limitado pelas regras
  cliente. Mudanças financeiras e de assinatura devem ocorrer exclusivamente
  nesse backend.
- `ENABLE_SANDBOX_FALLBACK` só fica ativo quando
  `NODE_ENV != production` e a variável é exatamente `true`. Nesse modo o
  middleware cria um utilizador de demonstração com `super_admin`; o modo é
  proibido em qualquer ambiente que contenha dados reais.

## Contrato de `/users/{userId}`

O proprietário pode criar o próprio documento, desde que IDs/e-mail coincidam
com a autenticação e não introduza privilégios, saldos ou estado de pagamento.
Pode atualizar apenas:

`displayName`, `photoURL`, `age`, `gender`, `countryCode`,
`nativeLanguage`, `learningLanguage`, `targetRegion`, `languageMode`,
`allowRegionalExpressions`, `allowSlang`, `level`, `learningGoal`,
`dailyGoal`, `studyFrequency`, `onboardingStep`, `onboardingCompleted`,
`profileCompleted`, `welcomeCompleted`, `notificationSettings`,
`updatedAt`, `status` e `learningIntent`.

`role`, `paymentCompleted`, `subscriptionStatus`,
`subscriptionPlanId` e `subscriptionActive` são imutáveis pelo cliente.
Administradores/backend mantêm o caminho de atualização privilegiada.

## Famílias de coleções

| Família | Leitura cliente | Escrita cliente | Autoridade principal |
|---|---|---|---|
| `users`, `profiles`, `intelligentProfiles` | proprietário/admin; perfis autenticados conforme regra | perfil próprio com allowlist | Auth UID + admin |
| `schools`, `teachers`, `students`, `companies` | autenticado, tenant, professor, pai ou admin conforme coleção | maioritariamente admin/proprietário verificado | tenant/owner/admin |
| `pagamentos`, `payments` | proprietário/tenant/admin | nenhuma escrita cliente | backend Admin SDK |
| `subscriptions` | proprietário/admin | atualmente proprietário pode criar/atualizar | proprietário/admin |
| `courses`, `lessons`, `assessments`, `questionBank` | autenticado | admin | admin |
| `certificates`, `marketplace`, `avatars`, `gamification` | autenticado ou proprietário | admin; certificados imutáveis | admin |
| `aiSessions`, `aiMemory`, `languageProfiles` | proprietário/admin | proprietário verificado | Auth UID |
| `analyticsEvents`, `systemLogs`, `auditLogs` | admin | criação autenticada; sem edição posterior | cliente autenticado/admin |
| `user_gamification`, `leaderboard_entries`, `xp_audit_logs` | conforme regra | bloqueada | backend Admin SDK |
| `pronunciation_*`, `adaptive_*` | proprietário/admin | proprietário verificado; admin para remoção | Auth UID/admin |

Todas as coleções não declaradas terminam em deny-all.

## Índices versionados

O inventário versionado define índices compostos para `users`, `lessons`,
`gamification`, `notifications` e `aiSessions`.

## Verificação automatizada

- `npm run test:firestore-rules` inicia o emulador e executa 124 cenários:
  54 verificações estruturais e 70 operações reais contra as regras.
- `npm run check` inclui typecheck, 939 testes da aplicação, os 124 cenários
  Firebase, auditoria de dependências de produção e o build.
- Alterações em `firestore.rules` exigem teste negativo para o abuso bloqueado
  e teste positivo para o fluxo legítimo preservado.

## Avaliação de segurança das regras

```json
{
  "score": 2,
  "summary": "O deny-all final, o isolamento de pagamentos e a allowlist de users são bons, mas ainda existem coleções com escrita autenticada ampla e contratos duplicados divergentes.",
  "findings": [
    {
      "severity": "high",
      "location": "firestore.rules:255-256",
      "issue": "O proprietário pode criar e atualizar subscriptions sem allowlist de campos de estado.",
      "abuse_path": "Um cliente autenticado pode tentar forjar estado ou período da própria assinatura.",
      "fix": "Tornar a escrita server-only ou permitir apenas pedidos sem campos financeiros/estado."
    },
    {
      "severity": "high",
      "location": "firestore.rules:679,692,699,704",
      "issue": "learningStatistics, rankings, schedules e classes aceitam escrita de qualquer utilizador autenticado.",
      "abuse_path": "Um aluno pode alterar dados agregados ou institucionais que não lhe pertencem.",
      "fix": "Adicionar owner/tenant/role checks e allowlists de campos."
    },
    {
      "severity": "medium",
      "location": "firestore.rules:456-458,581-589",
      "issue": "Logs e eventos aceitam payload criado pelo cliente sem esquema/identidade imutável.",
      "abuse_path": "Um utilizador pode inserir eventos falsificados ou payloads excessivos.",
      "fix": "Validar actorUid == request.auth.uid, tipos, tamanho e campos permitidos."
    },
    {
      "severity": "medium",
      "location": "firebase/rules/firestore.rules",
      "issue": "Existe uma segunda política divergente que não é a fonte de deploy.",
      "abuse_path": "Um operador pode publicar por engano regras diferentes das testadas.",
      "fix": "Eliminar a duplicação após confirmar consumidores ou gerar ambos os caminhos a partir de uma única fonte."
    }
  ]
}
```

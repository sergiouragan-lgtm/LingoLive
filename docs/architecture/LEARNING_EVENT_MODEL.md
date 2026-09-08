# Modelo canónico de aprendizagem v1

Firestore Standard é a fonte oficial. O backend recebe evidência confirmada em `POST /api/learning/events` e grava, numa única transação, o evento imutável e a projeção do gap. Não existe fallback local em produção.

## Fluxo

`Tentativa → erro confirmado → gap atualizado → recomendação → atividade corretiva → nova avaliação → remediação/domínio`

Eventos `ATTEMPT_EVALUATED` incorretos aumentam o gap conforme a gravidade e criam uma recomendação e uma atividade corretiva determinísticas. Eventos `REASSESSMENT_EVALUATED` corretos reduzem o score; duas reavaliações corretas e score até `0.15` mudam o gap para `mastered`.

## Contrato obrigatório

- `schemaVersion`: `1.0`;
- `eventType`: `ATTEMPT_EVALUATED` ou `REASSESSMENT_EVALUATED`;
- `studentId` e `tenantId` validados contra a identidade autenticada;
- `languageCode` e `cefrLevel`;
- `activity.id` e `activity.type`;
- `response.actual` e, quando aplicável, `response.expected`;
- `target.type`, `target.key` normalizada e `target.label`;
- `result.outcome`, `result.score` de 0 a 1 e `result.confirmed: true`;
- `severity`: `none`, `low`, `medium`, `high` ou `critical`;
- `occurredAt` em ISO-8601;
- `idempotencyKey` estável por tentativa/item.

## Coleções

- `learning_events/{sha256(tenantId,idempotencyKey)}`: ledger imutável;
- `student_learning_gaps/{sha256(tenant,student,language,type,key)}`: projeção atual;
- `learning_recommendations/{sha256(gapId,recommendation)}`;
- `corrective_activities/{sha256(gapId,activity)}`.

Clientes autenticados leem apenas documentos cujo `studentId` seja o seu UID. Escritas diretas são negadas; somente o Admin SDK do backend projeta estado.

## Idempotência e concorrência

A chave de idempotência gera o ID do evento. A transação lê evento e gap antes de escrever. Um retry encontra o evento existente e retorna `duplicate: true`, sem incrementar novamente o gap.

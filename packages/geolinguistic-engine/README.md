# LingoLive GeoLinguistic Engine v2

Incremental regional-language layer. It does not replace existing learning flows.

## Implemented
- Variant resolution: explicit learner choice > matching device locale > country signal > selected base language.
- Locale normalization and cross-language guardrails.
- Regional-expression detection with Unicode boundaries and repeated matches.
- Protection from generic normalization only for expressions valid in the active variant.
- Tutor context injection before correction-model execution.
- Post-model correction filtering while preserving unrelated grammar corrections.
- Privacy-preserving, non-blocking telemetry.
- Portuguese seed structure (`pt-AO`, `pt-PT`, `pt-BR`).
- `GeoAwareTutorPipeline` for correction adapters.
- `attachGeoLinguisticCorrectionPipeline` for the application AIEngineOrchestrator boundary; preserves the existing orchestrator instance and execution, and is idempotent.
- Typecheck/Vitest CI workflow for this package.

## Runtime order
1. Resolve active variant.
2. Append GeoLinguistic instruction to existing Tutor system instructions.
3. Execute the existing correction/orchestration path.
4. Detect regional expressions in learner input.
5. Suppress only exact generic-normalization corrections for expressions valid in the active variant.
6. Preserve unrelated corrections.
7. Emit privacy-safe telemetry.

## Application contract
`TutorPipelineInput.geoSystemInstructions` carries the additional regional system context into the existing provider/orchestrator implementation. The application provider adapter must append these instructions to its existing system prompt rather than replacing security, pedagogical, quota, or policy instructions.

The orchestrator can be wired once at composition/bootstrap time with `attachGeoLinguisticCorrectionPipeline(orchestrator, options)`. Repeated attachment is ignored to prevent duplicate filtering and duplicated prompt context.

## Safety
Geolocation is a low-confidence language-variant signal, never proof of identity. Explicit learner choice has precedence. Raw learner text and detected expressions are excluded from GeoLinguistic telemetry.

## Next production step
Wire the application's concrete Tutor provider adapter to consume `geoSystemInstructions`, then validate end-to-end through the deployed text and voice Tutor flows. After that, migrate the seed lexicon to reviewed persistent/versioned storage with provenance and moderation.

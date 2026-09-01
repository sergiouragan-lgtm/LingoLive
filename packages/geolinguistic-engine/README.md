# LingoLive GeoLinguistic Engine v2

Incremental regional-language layer. It does not replace existing learning flows.

## Implemented

- Variant resolution with explicit learner choice > matching device locale > country signal > selected base language.
- Locale normalization and cross-language guardrails.
- Regional-expression detection with Unicode word boundaries and repeated-match support.
- Correction protection for known expressions valid in the active variant.
- Tutor context instruction for variant-aware responses.
- Privacy-preserving telemetry metadata; raw learner text and detected expressions are not emitted.
- Telemetry failure isolation so analytics cannot break learner corrections.
- Initial reviewed seed structure for Portuguese variants (`pt-AO`, `pt-PT`, `pt-BR`).
- `GeoAwareTutorPipeline`: injects GeoLinguistic context before the correction model and filters generic normalization after model output.
- `attachGeoLinguisticCorrectionPipeline`: adapter boundary for the application `AIEngineOrchestrator`.
- Independent TypeScript typecheck and Vitest CI workflow.

## Runtime order

1. Resolve the active language variant from learner choice/device/country signals.
2. Build the Tutor model request with the regional instruction.
3. Execute the existing correction model through `TutorCorrectionAdapter`.
4. Detect regional expressions in the learner text.
5. Remove only exact normalization corrections for expressions valid in the active variant.
6. Return all unrelated grammar corrections unchanged.
7. Emit privacy-safe regional telemetry without blocking the learning flow.

## Safety rule

Geolocation is a low-confidence language-variant signal, never proof of identity. Explicit learner language/variant choices take precedence. A variant explicitly supplied for a different language is rejected.

## Application wiring

The application Tutor service should instantiate `GeoAwareTutorPipeline` with its existing correction adapter. `AIEngineOrchestrator.correctLearnerText` can then delegate through `attachGeoLinguisticCorrectionPipeline`. This keeps provider/model implementation outside the GeoLinguistic package and prevents the regional layer from bypassing existing AI security, quota, or persistence controls.

## Next production step

Replace the seed lexicon with a reviewed persistent/versioned regional dataset and connect the application's telemetry sink. Validate end-to-end in the deployed Tutor UI and voice/correction flows before expanding languages.

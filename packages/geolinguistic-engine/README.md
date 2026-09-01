# LingoLive GeoLinguistic Engine v2

Incremental regional-language layer. It does not replace existing learning flows.

## Implemented

- Variant resolution with explicit learner choice > matching device locale > country signal > selected base language.
- Locale normalization and cross-language guardrails.
- Regional-expression detection with Unicode word boundaries and repeated-match support.
- Correction protection: an exact known regional expression is not automatically normalized as a grammar error.
- Tutor context instruction for variant-aware responses.
- Privacy-preserving telemetry metadata; raw learner text and detected expressions are not emitted.
- Telemetry failure isolation so analytics cannot break the learner correction flow.
- Initial reviewed seed structure for Portuguese variants (`pt-AO`, `pt-PT`, `pt-BR`).
- Independent TypeScript typecheck and Vitest CI workflow.

## Safety rule

Geolocation is a low-confidence language-variant signal, never proof of identity. Explicit learner language/variant choices take precedence. A variant explicitly supplied for a different language is rejected.

## Integration contract

Use `buildTutorGeoContext()` while constructing Tutor model context. Run generic grammar corrections, then pass correction candidates through `protectRegionalExpressions()` before presenting them to the learner. Persist explicit learner-selected variant separately from inferred signals.

## Next production integration

Wire these functions into the existing application Tutor/correction services after repository CI is green, then move the regional lexicon to a reviewed persistent dataset with versioning and moderation provenance.

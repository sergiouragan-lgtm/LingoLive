# LingoLive GeoLinguistic Engine v2

Incremental regional-language layer. It does not replace existing learning flows.

## Signal priority

1. Explicit learner choice
2. Matching device locale
3. Country signal
4. Selected base language

Geolocation is never treated as proof of the learner's linguistic identity.

## Regional-expression correction contract

Recognized regionalisms are classified before grammar correction. A known regional expression is not automatically marked as an error. The engine returns meaning, standard-language equivalent, register and regions so the Tutor can explain usage contextually.

## Next integration points

- Tutor context builder: attach `RegionalLanguageProfile` to the model context.
- Correction pipeline: call `detect()` before grammar normalization.
- Telemetry: emit privacy-preserving `regional_expression_detected` and correction outcome events.
- Persist learner-selected variant separately from inferred signals.
- Expand the lexicon through reviewed datasets rather than hard-coded demo content.

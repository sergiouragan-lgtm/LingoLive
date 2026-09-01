import { RegionalExpressionEngine, RegionalLanguageProfile, resolveRegionalLanguageProfile } from './index';
export interface TutorGeoContext { profile: RegionalLanguageProfile; instruction: string; }
export interface CorrectionCandidate { original: string; replacement?: string; reason?: string; }
export interface GeoTelemetrySink { emit(event: 'regional_expression_detected', payload: Record<string, string | number | boolean>): void | Promise<void>; }
export function buildTutorGeoContext(input: Parameters<typeof resolveRegionalLanguageProfile>[0]): TutorGeoContext { const profile = resolveRegionalLanguageProfile(input); return { profile, instruction: `Use ${profile.variant} as the learner's active language variant. Preserve valid regional vocabulary and explain register or standard equivalents when pedagogically useful. Never infer identity from location.` }; }
function correctionTargetsMatch(correction: CorrectionCandidate, expression: string): boolean { return correction.original.trim().toLocaleLowerCase() === expression.trim().toLocaleLowerCase(); }
export async function protectRegionalExpressions(input: { text: string; corrections: CorrectionCandidate[]; profile: RegionalLanguageProfile; engine: RegionalExpressionEngine; telemetry?: GeoTelemetrySink; }): Promise<CorrectionCandidate[]> {
  const matches = input.engine.detect(input.text, input.profile); if (!matches.length) return input.corrections;
  const classifications = matches.map((match) => ({ match, classification: input.engine.classifyForCorrection(match, input.profile) }));
  const protectedMatches = classifications.filter(({ classification }) => classification.shouldProtectFromNormalization).map(({ match }) => match);
  if (input.telemetry) for (const { match, classification } of classifications) { try { await input.telemetry.emit('regional_expression_detected', { languageVariant: input.profile.variant, register: match.register, expectedVariant: classification.isExpectedVariant }); } catch { /* telemetry must never block learner corrections */ } }
  return input.corrections.filter((correction) => !protectedMatches.some((match) => correctionTargetsMatch(correction, match.expression)));
}

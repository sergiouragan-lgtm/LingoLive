export type LanguageVariant = string;
export interface RegionalLanguageProfile { country?: string; region?: string; deviceLocale?: string; selectedLanguage: string; targetLanguage?: string; variant: LanguageVariant; confidence: number; sources: Array<'selected' | 'device' | 'country' | 'explicit'>; }
export interface RegionalExpression { expression: string; language: string; variants: string[]; regions: string[]; meaning: string; standardEquivalent?: string; register: 'formal' | 'neutral' | 'informal' | 'slang' | 'vulgar'; contexts?: string[]; }
export interface ExpressionMatch extends RegionalExpression { start: number; end: number; }
const COUNTRY_VARIANTS: Record<string, Record<string, string>> = { pt: { AO: 'pt-AO', BR: 'pt-BR', PT: 'pt-PT', MZ: 'pt-MZ', CV: 'pt-CV' }, en: { US: 'en-US', GB: 'en-GB', AU: 'en-AU', CA: 'en-CA' }, es: { ES: 'es-ES', MX: 'es-MX', AR: 'es-AR', CO: 'es-CO' }, fr: { FR: 'fr-FR', CA: 'fr-CA' } };
function normalizeLocale(locale?: string): string | undefined { const value = locale?.trim().replace('_', '-'); if (!value) return undefined; const [language, region] = value.split('-'); return region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase(); }
function baseLanguage(locale?: string): string | undefined { return normalizeLocale(locale)?.split('-')[0]; }
function isWordChar(char?: string): boolean { return Boolean(char && /[\p{L}\p{N}_]/u.test(char)); }
function hasBoundaries(text: string, start: number, length: number): boolean { return !isWordChar(text[start - 1]) && !isWordChar(text[start + length]); }
function sameVariant(left?: string, right?: string): boolean { const a = normalizeLocale(left); const b = normalizeLocale(right); return Boolean(a && b && (a === b || !a.includes('-') || !b.includes('-')) && baseLanguage(a) === baseLanguage(b)); }
export function resolveRegionalLanguageProfile(input: { selectedLanguage: string; targetLanguage?: string; explicitVariant?: string; deviceLocale?: string; country?: string; region?: string; }): RegionalLanguageProfile {
  const selected = baseLanguage(input.selectedLanguage) ?? input.selectedLanguage.toLowerCase(); const country = input.country?.toUpperCase(); const device = normalizeLocale(input.deviceLocale); const deviceBase = baseLanguage(device); const explicit = normalizeLocale(input.explicitVariant); const common = { country: input.country, region: input.region, deviceLocale: input.deviceLocale, selectedLanguage: input.selectedLanguage, targetLanguage: input.targetLanguage };
  if (explicit && baseLanguage(explicit) === selected) return { ...common, variant: explicit, confidence: 1, sources: ['explicit', 'selected'] };
  if (device && deviceBase === selected && device.includes('-')) return { ...common, variant: device, confidence: 0.9, sources: ['selected', 'device'] };
  const countryVariant = country ? COUNTRY_VARIANTS[selected]?.[country] : undefined; if (countryVariant) return { ...common, variant: countryVariant, confidence: 0.75, sources: ['selected', 'country'] };
  return { ...common, variant: selected, confidence: 0.5, sources: ['selected'] };
}
export class RegionalExpressionEngine {
  constructor(private readonly entries: RegionalExpression[] = []) {}
  detect(text: string, profile: RegionalLanguageProfile): ExpressionMatch[] { const normalized = text.toLocaleLowerCase(); const language = baseLanguage(profile.variant) ?? baseLanguage(profile.selectedLanguage); const matches: ExpressionMatch[] = []; for (const entry of this.entries) { if (baseLanguage(entry.language) !== language) continue; const needle = entry.expression.toLocaleLowerCase(); if (!needle) continue; let from = 0; while (from < normalized.length) { const start = normalized.indexOf(needle, from); if (start < 0) break; if (hasBoundaries(normalized, start, needle.length)) matches.push({ ...entry, start, end: start + entry.expression.length }); from = start + needle.length; } } return matches.sort((a, b) => a.start - b.start || b.expression.length - a.expression.length); }
  classifyForCorrection(match: ExpressionMatch, profile: RegionalLanguageProfile) { const expected = match.variants.some((variant) => sameVariant(variant, profile.variant)); return { isRegionalism: true, shouldMarkAsError: false, shouldProtectFromNormalization: expected, isExpectedVariant: expected, explanation: match.meaning, standardEquivalent: match.standardEquivalent, register: match.register, regions: match.regions }; }
}

export { buildTutorGeoContext, protectRegionalExpressions } from './integration';
export { PORTUGUESE_REGIONAL_EXPRESSIONS } from './lexicon.pt';
export { GeoAwareTutorPipeline, attachGeoLinguisticCorrectionPipeline } from './tutor-pipeline';
export type { CorrectionCandidate, GeoTelemetrySink, TutorGeoContext } from './integration';
export type { TutorPipelineInput, TutorCorrectionAdapter, TutorModelRequest, AIEngineOrchestratorLike } from './tutor-pipeline';

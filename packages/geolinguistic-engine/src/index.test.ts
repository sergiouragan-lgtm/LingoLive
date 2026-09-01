import { describe, expect, it } from 'vitest';
import { RegionalExpressionEngine, resolveRegionalLanguageProfile } from './index';
describe('resolveRegionalLanguageProfile', () => {
  it('prefers and normalizes a same-language explicit variant', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO', explicitVariant: 'PT_br' }).variant).toBe('pt-BR'));
  it('rejects an explicit variant from another language', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO', explicitVariant: 'en-US' }).variant).toBe('pt-AO'));
  it('uses matching device locale before geolocation', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'pt-PT', country: 'AO' }).variant).toBe('pt-PT'));
  it('normalizes device locale casing', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'PT_ao', country: 'BR' }).variant).toBe('pt-AO'));
  it('uses country only as a lower-confidence signal', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' }).confidence).toBeLessThan(0.9));
  it('does not allow unrelated device language to override selected language', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'en-US', country: 'AO' }).variant).toBe('pt-AO'));
});
describe('RegionalExpressionEngine', () => {
  const entry = { expression: 'bué', language: 'pt', variants: ['pt-AO'], regions: ['Angola'], meaning: 'muito', standardEquivalent: 'muito', register: 'slang' as const }; const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' }); const engine = new RegionalExpressionEngine([entry]);
  it('recognizes active-variant expression and protects it from normalization', () => { const [match] = engine.detect('Gostei bué da aula.', profile); const c = engine.classifyForCorrection(match, profile); expect(c.isExpectedVariant).toBe(true); expect(c.shouldMarkAsError).toBe(false); expect(c.shouldProtectFromNormalization).toBe(true); });
  it('recognizes another-variant regionalism without falsely calling it an error', () => { const other = new RegionalExpressionEngine([{ ...entry, variants: ['pt-PT'] }]); const [match] = other.detect('bué', profile); const c = other.classifyForCorrection(match, profile); expect(c.isRegionalism).toBe(true); expect(c.isExpectedVariant).toBe(false); expect(c.shouldMarkAsError).toBe(false); expect(c.shouldProtectFromNormalization).toBe(false); });
  it('normalizes variant comparison during classification', () => { const casingEngine = new RegionalExpressionEngine([{ ...entry, variants: ['PT_ao'] }]); const [match] = casingEngine.detect('bué', profile); expect(casingEngine.classifyForCorrection(match, profile).isExpectedVariant).toBe(true); });
  it('supports language-wide lexicon entries', () => { const broadEngine = new RegionalExpressionEngine([{ ...entry, variants: ['pt'] }]); const [match] = broadEngine.detect('bué', profile); expect(broadEngine.classifyForCorrection(match, profile).isExpectedVariant).toBe(true); });
  it('detects repeated regional expressions', () => expect(engine.detect('bué bom, bué mesmo', profile)).toHaveLength(2));
  it('does not match a regional term inside a larger word', () => expect(engine.detect('imbuével', profile)).toHaveLength(0));
  it('ignores empty lexicon entries safely', () => expect(new RegionalExpressionEngine([{ ...entry, expression: '' }]).detect('texto', profile)).toEqual([]));
});

import { describe, expect, it } from 'vitest';
import { RegionalExpressionEngine, resolveRegionalLanguageProfile } from './index';

describe('resolveRegionalLanguageProfile', () => {
  it('prefers an explicit variant', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO', explicitVariant: 'pt-BR' }).variant).toBe('pt-BR'));
  it('uses matching device locale before geolocation', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'pt-PT', country: 'AO' }).variant).toBe('pt-PT'));
  it('uses country only as a lower-confidence signal', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' }).confidence).toBeLessThan(0.9));
  it('does not allow an unrelated device language to override the selected language', () => expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'en-US', country: 'AO' }).variant).toBe('pt-AO'));
});

describe('RegionalExpressionEngine', () => {
  const engine = new RegionalExpressionEngine([{ expression: 'bué', language: 'pt', variants: ['pt-AO'], regions: ['Angola'], meaning: 'muito; em grande quantidade', standardEquivalent: 'muito', register: 'slang' }]);
  const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' });

  it('recognizes a regional expression without treating it as an error', () => {
    const [match] = engine.detect('Gostei bué da aula.', profile);
    expect(match.expression).toBe('bué');
    expect(engine.classifyForCorrection(match, profile).shouldMarkAsError).toBe(false);
  });

  it('detects repeated regional expressions', () => expect(engine.detect('bué bom, bué mesmo', profile)).toHaveLength(2));
});

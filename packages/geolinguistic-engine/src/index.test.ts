import { describe, expect, it } from 'vitest';
import { RegionalExpressionEngine, resolveRegionalLanguageProfile } from './index';

describe('resolveRegionalLanguageProfile', () => {
  it('prefers an explicit variant', () => {
    expect(resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO', explicitVariant: 'pt-BR' }).variant).toBe('pt-BR');
  });

  it('uses matching device locale before geolocation', () => {
    const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', deviceLocale: 'pt-PT', country: 'AO' });
    expect(profile.variant).toBe('pt-PT');
    expect(profile.sources).toContain('device');
  });

  it('uses country only as a lower-confidence signal', () => {
    const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' });
    expect(profile.variant).toBe('pt-AO');
    expect(profile.confidence).toBeLessThan(0.9);
  });
});

describe('RegionalExpressionEngine', () => {
  it('recognizes a regional expression without treating it as an error', () => {
    const engine = new RegionalExpressionEngine([{ expression: 'bué', language: 'pt', variants: ['pt-AO'], regions: ['Angola'], meaning: 'muito; em grande quantidade', standardEquivalent: 'muito', register: 'slang' }]);
    const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' });
    const [match] = engine.detect('Gostei bué da aula.', profile);
    expect(match.expression).toBe('bué');
    expect(engine.classifyForCorrection(match, profile).shouldMarkAsError).toBe(false);
  });
});

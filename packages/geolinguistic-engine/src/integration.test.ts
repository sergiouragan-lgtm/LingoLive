import { describe, expect, it, vi } from 'vitest';
import { RegionalExpressionEngine, resolveRegionalLanguageProfile } from './index';
import { buildTutorGeoContext, protectRegionalExpressions } from './integration';

const entries = [{ expression: 'bué', language: 'pt', variants: ['pt-AO'], regions: ['Angola'], meaning: 'muito', standardEquivalent: 'muito', register: 'slang' as const }];

describe('Tutor Geo integration', () => {
  it('builds variant-aware context without asserting identity from location', () => {
    const context = buildTutorGeoContext({ selectedLanguage: 'pt', country: 'AO' });
    expect(context.profile.variant).toBe('pt-AO');
    expect(context.instruction).toContain('Never infer identity from location');
  });

  it('protects known regionalisms from generic grammar replacement', async () => {
    const engine = new RegionalExpressionEngine(entries);
    const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' });
    const corrections = await protectRegionalExpressions({ text: 'Isso é bué bom', profile, engine, corrections: [{ original: 'bué', replacement: 'muito' }, { original: 'bom', replacement: 'ótimo' }] });
    expect(corrections).toEqual([{ original: 'bom', replacement: 'ótimo' }]);
  });

  it('emits telemetry without raw learner text', async () => {
    const emit = vi.fn();
    const engine = new RegionalExpressionEngine(entries);
    const profile = resolveRegionalLanguageProfile({ selectedLanguage: 'pt', country: 'AO' });
    await protectRegionalExpressions({ text: 'bué', profile, engine, corrections: [], telemetry: { emit } });
    expect(emit).toHaveBeenCalledWith('regional_expression_detected', expect.objectContaining({ languageVariant: 'pt-AO', register: 'slang' }));
    expect(JSON.stringify(emit.mock.calls)).not.toContain('Isso é');
  });
});

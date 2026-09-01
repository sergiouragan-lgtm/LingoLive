import { describe, expect, it } from 'vitest';
import { appendGeoInstruction, buildGeoLinguisticTutorContext } from './geoLinguisticTutorBridge';

describe('GeoLinguistic Tutor bridge', () => {
  it('maps language names and target region to a BCP-47 variant', () => {
    expect(buildGeoLinguisticTutorContext({ languageTarget: 'Portuguese', targetRegion: 'AO' }).profile.variant).toBe('pt-AO');
    expect(buildGeoLinguisticTutorContext({ languageTarget: 'English', targetRegion: 'GB' }).profile.variant).toBe('en-GB');
  });
  it('prefers an explicit same-language variant', () => {
    expect(buildGeoLinguisticTutorContext({ languageTarget: 'Português', explicitVariant: 'pt-BR', targetRegion: 'AO' }).profile.variant).toBe('pt-BR');
  });
  it('appends policy without replacing the existing lesson context', () => {
    const value = appendGeoInstruction('restaurant', 'Use pt-AO as the active variant.');
    expect(value).toContain('restaurant');
    expect(value).toContain('pt-AO');
    expect(value).toContain('never normalize valid vocabulary');
  });
});

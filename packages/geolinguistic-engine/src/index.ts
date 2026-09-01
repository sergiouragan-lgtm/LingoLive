export type LanguageVariant = `${string}-${string}`;

export interface RegionalLanguageProfile {
  country?: string;
  region?: string;
  deviceLocale?: string;
  selectedLanguage: string;
  targetLanguage?: string;
  variant: LanguageVariant | string;
  confidence: number;
  sources: Array<'selected' | 'device' | 'country' | 'explicit'>;
}

export interface RegionalExpression {
  expression: string;
  language: string;
  variants: string[];
  regions: string[];
  meaning: string;
  standardEquivalent?: string;
  register: 'formal' | 'neutral' | 'informal' | 'slang' | 'vulgar';
  contexts?: string[];
}

export interface ExpressionMatch extends RegionalExpression {
  start: number;
  end: number;
}

const COUNTRY_VARIANTS: Record<string, Record<string, string>> = {
  pt: { AO: 'pt-AO', BR: 'pt-BR', PT: 'pt-PT', MZ: 'pt-MZ', CV: 'pt-CV' },
  en: { US: 'en-US', GB: 'en-GB', AU: 'en-AU', CA: 'en-CA' },
  es: { ES: 'es-ES', MX: 'es-MX', AR: 'es-AR', CO: 'es-CO' },
  fr: { FR: 'fr-FR', CA: 'fr-CA' },
};

function baseLanguage(locale?: string): string | undefined {
  return locale?.trim().replace('_', '-').split('-')[0]?.toLowerCase();
}

export function resolveRegionalLanguageProfile(input: {
  selectedLanguage: string;
  targetLanguage?: string;
  explicitVariant?: string;
  deviceLocale?: string;
  country?: string;
  region?: string;
}): RegionalLanguageProfile {
  const selected = baseLanguage(input.selectedLanguage) ?? input.selectedLanguage.toLowerCase();
  const country = input.country?.toUpperCase();
  const device = input.deviceLocale?.replace('_', '-');
  const deviceBase = baseLanguage(device);

  if (input.explicitVariant) {
    return { ...input, variant: input.explicitVariant, confidence: 1, sources: ['explicit', 'selected'] };
  }

  if (device && deviceBase === selected && device.includes('-')) {
    return { ...input, variant: device, confidence: 0.9, sources: ['selected', 'device'] };
  }

  const countryVariant = country ? COUNTRY_VARIANTS[selected]?.[country] : undefined;
  if (countryVariant) {
    return { ...input, variant: countryVariant, confidence: 0.75, sources: ['selected', 'country'] };
  }

  return { ...input, variant: selected, confidence: 0.5, sources: ['selected'] };
}

export class RegionalExpressionEngine {
  private readonly entries: RegionalExpression[];

  constructor(entries: RegionalExpression[] = []) {
    this.entries = entries;
  }

  detect(text: string, profile: RegionalLanguageProfile): ExpressionMatch[] {
    const normalized = text.toLocaleLowerCase();
    const language = baseLanguage(profile.variant) ?? baseLanguage(profile.selectedLanguage);
    const matches: ExpressionMatch[] = [];

    for (const entry of this.entries) {
      if (baseLanguage(entry.language) !== language) continue;
      const start = normalized.indexOf(entry.expression.toLocaleLowerCase());
      if (start < 0) continue;
      matches.push({ ...entry, start, end: start + entry.expression.length });
    }
    return matches.sort((a, b) => a.start - b.start);
  }

  classifyForCorrection(match: ExpressionMatch, profile: RegionalLanguageProfile) {
    const isExpectedVariant = match.variants.includes(profile.variant);
    return {
      isRegionalism: true,
      shouldMarkAsError: false,
      isExpectedVariant,
      explanation: match.meaning,
      standardEquivalent: match.standardEquivalent,
      register: match.register,
      regions: match.regions,
    };
  }
}

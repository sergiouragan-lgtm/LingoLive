import { buildTutorGeoContext } from '../../../packages/geolinguistic-engine/src/index';

const LANGUAGE_ALIASES: Record<string, string> = {
  english: 'en', 'inglês': 'en', ingles: 'en', portuguese: 'pt', 'português': 'pt', portugues: 'pt',
  spanish: 'es', espanhol: 'es', french: 'fr', 'francês': 'fr', frances: 'fr', german: 'de', 'alemão': 'de', alemao: 'de',
};

function baseLanguage(value?: string): string {
  const normalized = String(value || '').trim().toLocaleLowerCase().replace('_', '-');
  return LANGUAGE_ALIASES[normalized] || normalized.split('-')[0] || 'en';
}

export interface GeoTutorBridgeInput {
  selectedLanguage?: string;
  languageTarget?: string;
  explicitVariant?: string;
  deviceLocale?: string;
  country?: string;
  region?: string;
  targetRegion?: string;
  localization?: { country?: string };
}

export function buildGeoLinguisticTutorContext(input: GeoTutorBridgeInput) {
  const targetRegion = String(input.targetRegion || '').trim().toUpperCase();
  const country = String(input.country || input.localization?.country || '').trim().toUpperCase();
  return buildTutorGeoContext({
    selectedLanguage: baseLanguage(input.selectedLanguage || input.languageTarget),
    explicitVariant: input.explicitVariant,
    deviceLocale: input.deviceLocale,
    country: targetRegion || country || undefined,
    region: input.region,
  });
}

export function appendGeoInstruction(lessonContext: string, instruction: string): string {
  const clean = String(lessonContext || '').trim() || 'conversation-practice';
  return `${clean}\n\nREGIONAL LANGUAGE POLICY:\n${instruction}\nCorrect genuine grammar, spelling, meaning and pronunciation errors, but never normalize valid vocabulary merely because it belongs to the active regional variant.`;
}

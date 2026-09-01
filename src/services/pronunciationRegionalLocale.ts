const LANGUAGE_BASES: Record<string, string> = { english: 'en', 'inglês': 'en', ingles: 'en', portuguese: 'pt', 'português': 'pt', portugues: 'pt', spanish: 'es', espanhol: 'es', french: 'fr', 'francês': 'fr', frances: 'fr' };
export function resolvePronunciationLocale(language: string, explicitVariant?: string, deviceLocale?: string): string {
  const raw = String(language || '').trim(); const normalized = raw.toLocaleLowerCase().replace('_', '-'); const base = LANGUAGE_BASES[normalized] || normalized.split('-')[0] || 'en';
  const explicit = String(explicitVariant || '').trim().replace('_', '-'); if (explicit.toLocaleLowerCase().split('-')[0] === base && explicit.includes('-')) return `${base}-${explicit.split('-')[1].toUpperCase()}`;
  const device = String(deviceLocale || '').trim().replace('_', '-'); if (device.toLocaleLowerCase().split('-')[0] === base && device.includes('-')) return `${base}-${device.split('-')[1].toUpperCase()}`;
  if (normalized.includes('-')) return `${base}-${normalized.split('-')[1].toUpperCase()}`;
  return base === 'en' ? 'en-US' : base;
}

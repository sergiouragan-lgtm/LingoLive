
export interface TargetLanguagesState {
  readonly primaryLanguage: string | null;
  readonly targetLanguages: readonly string[];
}

export interface NormalizeTargetLanguagesInput {
  readonly primaryLanguage?: unknown;
  readonly targetLanguages?: unknown;
}

export const normalizeLanguageName = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  if (typeof value === 'object' && value !== null && 'value' in value) {
    const innerVal = (value as { value: unknown }).value;
    if (typeof innerVal === 'string') {
      const trimmed = innerVal.trim();
      return trimmed.length === 0 ? null : trimmed;
    }
  }
  return null;
};

export const normalizeTargetLanguages = (
  input: NormalizeTargetLanguagesInput
): TargetLanguagesState => {
  const normalizedPrimary = normalizeLanguageName(input.primaryLanguage);
  
  let langs: string[] = [];
  if (Array.isArray(input.targetLanguages)) {
    for (const lang of input.targetLanguages) {
      const normalized = normalizeLanguageName(lang);
      if (normalized) {
        langs.push(normalized);
      }
    }
  }

  // Deduplicate case-insensitive, preserving first grafia
  const seen = new Set<string>();
  const uniqueLangs: string[] = [];
  for (const lang of langs) {
    const lower = lang.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueLangs.push(lang);
    }
  }

  let primaryLanguage = normalizedPrimary;
  let targetLanguages = [...uniqueLangs];

  if (primaryLanguage) {
    // Ensure primary is in the list and at the start
    const index = targetLanguages.findIndex(l => l.toLowerCase() === primaryLanguage!.toLowerCase());
    if (index !== -1) {
      const existingGrafia = targetLanguages[index];
      primaryLanguage = existingGrafia;
      targetLanguages.splice(index, 1);
    }
    targetLanguages.unshift(primaryLanguage);
  }

  return Object.freeze({
    primaryLanguage,
    targetLanguages: Object.freeze(targetLanguages)
  });
};

export const setPrimaryTargetLanguage = (
  current: TargetLanguagesState,
  newPrimaryLanguage: unknown
): TargetLanguagesState => {
  const newPrimary = normalizeLanguageName(newPrimaryLanguage);
  if (!newPrimary) {
    return current;
  }

  const newTargetLanguages = [...current.targetLanguages];
  const index = newTargetLanguages.findIndex(l => l.toLowerCase() === newPrimary.toLowerCase());
  
  if (index !== -1) {
    const existingGrafia = newTargetLanguages[index];
    newTargetLanguages.splice(index, 1);
    newTargetLanguages.unshift(existingGrafia);
    return Object.freeze({
      primaryLanguage: existingGrafia,
      targetLanguages: Object.freeze(newTargetLanguages)
    });
  } else {
    newTargetLanguages.unshift(newPrimary);
    return Object.freeze({
      primaryLanguage: newPrimary,
      targetLanguages: Object.freeze(newTargetLanguages)
    });
  }
};

export const addTargetLanguage = (
  current: TargetLanguagesState,
  language: unknown
): TargetLanguagesState => {
  const newLang = normalizeLanguageName(language);
  if (!newLang) return current;

  if (current.targetLanguages.some(l => l.toLowerCase() === newLang.toLowerCase())) {
    return current;
  }

  const newTargetLanguages = [...current.targetLanguages, newLang];
  return Object.freeze({
    primaryLanguage: current.primaryLanguage,
    targetLanguages: Object.freeze(newTargetLanguages)
  });
};

export const removeTargetLanguage = (
  current: TargetLanguagesState,
  language: unknown
): TargetLanguagesState => {
  const langToRemove = normalizeLanguageName(language);
  if (!langToRemove) return current;

  const newTargetLanguages = current.targetLanguages.filter(
    l => l.toLowerCase() !== langToRemove.toLowerCase()
  );

  if (newTargetLanguages.length === current.targetLanguages.length) {
    return current;
  }

  let newPrimary = current.primaryLanguage;
  if (newPrimary && newPrimary.toLowerCase() === langToRemove.toLowerCase()) {
    newPrimary = newTargetLanguages.length > 0 ? newTargetLanguages[0] : null;
  }

  return Object.freeze({
    primaryLanguage: newPrimary,
    targetLanguages: Object.freeze(newTargetLanguages)
  });
};

export const clearPrimaryTargetLanguage = (
  current: TargetLanguagesState
): TargetLanguagesState => {
  if (current.primaryLanguage === null) return current;
  return Object.freeze({
    primaryLanguage: null,
    targetLanguages: Object.freeze([...current.targetLanguages])
  });
};

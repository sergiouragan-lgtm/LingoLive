import {
  LanguageOption,
  NativeDialectOption,
} from "../types/languagePreferences";

export interface CountryLanguageProfile {
  readonly countryCode: string;
  readonly countryName: string;
  readonly defaultInterfaceLanguage: string;
  readonly officialLanguages: readonly LanguageOption[];
  readonly regionalOptions: readonly NativeDialectOption[];
}

export interface AvailableCountryLanguageOptions {
  officialLanguages: LanguageOption[];
  regionalOptions: NativeDialectOption[];
}

const deepFreeze = <T>(obj: T): Readonly<T> => {
  if (obj === null || typeof obj !== "object") {
    return obj as Readonly<T>;
  }
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });
  return obj as Readonly<T>;
};

export const REGIONAL_LANGUAGE_CATALOG: Readonly<
  Record<string, CountryLanguageProfile>
> = deepFreeze({
  AO: {
    countryCode: "AO",
    countryName: "Angola",
    defaultInterfaceLanguage: "pt-AO",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "umbundu",
        name: "Umbundu",
        nativeName: "Umbundu",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "kimbundu",
        name: "Kimbundu",
        nativeName: "Kimbundu",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "kikongo",
        name: "Kikongo",
        nativeName: "Kikongo",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "cokwe",
        name: "Cokwe",
        nativeName: "Cokwe",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "kwanyama",
        name: "Kwanyama",
        nativeName: "Oshikwanyama",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "ngangela",
        name: "Ngangela",
        nativeName: "Ngangela",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "fiote",
        name: "Fiote",
        nativeName: "Ibinda",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "nhaneka",
        name: "Nhaneka",
        nativeName: "Nhaneka",
        countryCodes: ["AO"],
        kind: "national",
      },
      {
        id: "luvale",
        name: "Luvale",
        nativeName: "Luvale",
        countryCodes: ["AO"],
        kind: "national",
      },
    ],
  },
  MZ: {
    countryCode: "MZ",
    countryName: "Mozambique",
    defaultInterfaceLanguage: "pt-MZ",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "makhuwa",
        name: "Makhuwa",
        nativeName: "Emakhuwa",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "xitsonga",
        name: "Xitsonga",
        nativeName: "Xitsonga",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "sena",
        name: "Sena",
        nativeName: "Cisena",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "ndau",
        name: "Ndau",
        nativeName: "Cindau",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "lomwe",
        name: "Lomwe",
        nativeName: "Elomwe",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "chuwabu",
        name: "Chuwabu",
        nativeName: "Echuwabo",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "yao",
        name: "Yao",
        nativeName: "Ciyaao",
        countryCodes: ["MZ"],
        kind: "national",
      },
      {
        id: "makonde",
        name: "Makonde",
        nativeName: "Shimakonde",
        countryCodes: ["MZ"],
        kind: "national",
      },
    ],
  },
  ZA: {
    countryCode: "ZA",
    countryName: "South Africa",
    defaultInterfaceLanguage: "en-ZA",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "af", name: "Afrikaans", nativeName: "Afrikaans" },
      { code: "zu", name: "isiZulu", nativeName: "isiZulu" },
      { code: "xh", name: "isiXhosa", nativeName: "isiXhosa" },
      { code: "st", name: "Sesotho", nativeName: "Sesotho" },
      { code: "tn", name: "Setswana", nativeName: "Setswana" },
      { code: "nso", name: "Sepedi", nativeName: "Sepedi" },
      { code: "ss", name: "siSwati", nativeName: "siSwati" },
      { code: "ven", name: "Tshivenda", nativeName: "Tshivenda" },
      { code: "ts", name: "Xitsonga", nativeName: "Xitsonga" },
      { code: "nr", name: "isiNdebele", nativeName: "isiNdebele" },
    ],
    regionalOptions: [],
  },
  FR: {
    countryCode: "FR",
    countryName: "France",
    defaultInterfaceLanguage: "fr-FR",
    officialLanguages: [
      { code: "fr", name: "French", nativeName: "Français" },
    ],
    regionalOptions: [
      {
        id: "breton",
        name: "Breton",
        nativeName: "Brezhoneg",
        countryCodes: ["FR"],
        kind: "regional",
      },
      {
        id: "corsican",
        name: "Corsican",
        nativeName: "Corsu",
        countryCodes: ["FR"],
        kind: "regional",
      },
      {
        id: "occitan",
        name: "Occitan",
        nativeName: "Occitan",
        countryCodes: ["FR"],
        kind: "regional",
      },
      {
        id: "alsatian",
        name: "Alsatian",
        nativeName: "Elsässisch",
        countryCodes: ["FR"],
        kind: "regional",
      },
    ],
  },
  ES: {
    countryCode: "ES",
    countryName: "Spain",
    defaultInterfaceLanguage: "es-ES",
    officialLanguages: [
      { code: "es", name: "Spanish", nativeName: "Español" },
    ],
    regionalOptions: [
      {
        id: "catalan",
        name: "Catalan",
        nativeName: "Català",
        countryCodes: ["ES"],
        kind: "regional",
      },
      {
        id: "basque",
        name: "Basque",
        nativeName: "Euskara",
        countryCodes: ["ES"],
        kind: "regional",
      },
      {
        id: "galician",
        name: "Galician",
        nativeName: "Galego",
        countryCodes: ["ES"],
        kind: "regional",
      },
    ],
  },
  CA: {
    countryCode: "CA",
    countryName: "Canada",
    defaultInterfaceLanguage: "en-CA",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "fr", name: "French", nativeName: "Français" },
    ],
    regionalOptions: [
      {
        id: "cree",
        name: "Cree",
        nativeName: "Nēhiyawēwin",
        countryCodes: ["CA"],
        kind: "indigenous",
      },
      {
        id: "inuktitut",
        name: "Inuktitut",
        nativeName: "Inuktitut",
        countryCodes: ["CA"],
        kind: "indigenous",
      },
      {
        id: "ojibwe",
        name: "Ojibwe",
        nativeName: "Anishinaabemowin",
        countryCodes: ["CA"],
        kind: "indigenous",
      },
    ],
  },
  BR: {
    countryCode: "BR",
    countryName: "Brazil",
    defaultInterfaceLanguage: "pt-BR",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "guarani",
        name: "Guarani",
        nativeName: "Avañe'ẽ",
        countryCodes: ["BR"],
        kind: "indigenous",
      },
      {
        id: "nheengatu",
        name: "Nheengatu",
        nativeName: "Nheengatu",
        countryCodes: ["BR"],
        kind: "indigenous",
      },
      {
        id: "tikuna",
        name: "Tikuna",
        nativeName: "Tukuna",
        countryCodes: ["BR"],
        kind: "indigenous",
      },
      {
        id: "kaingang",
        name: "Kaingang",
        nativeName: "Kanhgág",
        countryCodes: ["BR"],
        kind: "indigenous",
      },
    ],
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan",
    defaultInterfaceLanguage: "ja-JP",
    officialLanguages: [
      { code: "ja", name: "Japanese", nativeName: "日本語" },
    ],
    regionalOptions: [
      {
        id: "ainu",
        name: "Ainu",
        nativeName: "Ainu-itak",
        countryCodes: ["JP"],
        kind: "indigenous",
      },
      {
        id: "ryukyuan",
        name: "Ryukyuan",
        nativeName: "Shimaakutubaa",
        countryCodes: ["JP"],
        kind: "regional",
      },
    ],
  },
  MX: {
    countryCode: "MX",
    countryName: "Mexico",
    defaultInterfaceLanguage: "es-MX",
    officialLanguages: [
      { code: "es", name: "Spanish", nativeName: "Español" },
    ],
    regionalOptions: [
      {
        id: "nahuatl",
        name: "Nahuatl",
        nativeName: "Nāhuatl",
        countryCodes: ["MX"],
        kind: "indigenous",
      },
      {
        id: "maya",
        name: "Maya",
        nativeName: "Maaya t'aan",
        countryCodes: ["MX"],
        kind: "indigenous",
      },
      {
        id: "mixtec",
        name: "Mixtec",
        nativeName: "Tu'un savi",
        countryCodes: ["MX"],
        kind: "indigenous",
      },
      {
        id: "zapotec",
        name: "Zapotec",
        nativeName: "Diidxazá",
        countryCodes: ["MX"],
        kind: "indigenous",
      },
    ],
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    defaultInterfaceLanguage: "en-US",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
    ],
    regionalOptions: [
      {
        id: "spanish",
        name: "Spanish",
        nativeName: "Español",
        countryCodes: ["US"],
        kind: "regional",
      },
      {
        id: "navajo",
        name: "Navajo",
        nativeName: "Diné bizaad",
        countryCodes: ["US"],
        kind: "indigenous",
      },
      {
        id: "cherokee",
        name: "Cherokee",
        nativeName: "Tsalagi Gawonihisdi",
        countryCodes: ["US"],
        kind: "indigenous",
      },
    ],
  },

  // --- PALOP e lusofonia (missão central do LingoLive) ---
  CV: {
    countryCode: "CV",
    countryName: "Cabo Verde",
    defaultInterfaceLanguage: "pt-CV",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "kriolu-santiago",
        name: "Cape Verdean Creole (Santiago)",
        nativeName: "Kriolu di Santiagu",
        countryCodes: ["CV"],
        kind: "national",
      },
      {
        id: "kriolu-sao-vicente",
        name: "Cape Verdean Creole (São Vicente)",
        nativeName: "Kriolu di São Vicente",
        countryCodes: ["CV"],
        kind: "national",
      },
    ],
  },
  GW: {
    countryCode: "GW",
    countryName: "Guiné-Bissau",
    defaultInterfaceLanguage: "pt-GW",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "kriol-gb",
        name: "Guinea-Bissau Creole",
        nativeName: "Kriol",
        countryCodes: ["GW"],
        kind: "national",
      },
      {
        id: "balanta",
        name: "Balanta",
        nativeName: "Balanta",
        countryCodes: ["GW"],
        kind: "indigenous",
      },
      {
        id: "fula-gb",
        name: "Fula",
        nativeName: "Pular",
        countryCodes: ["GW"],
        kind: "indigenous",
      },
    ],
  },
  ST: {
    countryCode: "ST",
    countryName: "São Tomé e Príncipe",
    defaultInterfaceLanguage: "pt-ST",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
    ],
    regionalOptions: [
      {
        id: "forro",
        name: "Forro",
        nativeName: "Forro",
        countryCodes: ["ST"],
        kind: "national",
      },
      {
        id: "angolar",
        name: "Angolar",
        nativeName: "Ngola",
        countryCodes: ["ST"],
        kind: "national",
      },
      {
        id: "principense",
        name: "Principense",
        nativeName: "Lung'Ie",
        countryCodes: ["ST"],
        kind: "national",
      },
    ],
  },
  TL: {
    countryCode: "TL",
    countryName: "Timor-Leste",
    defaultInterfaceLanguage: "pt-TL",
    officialLanguages: [
      { code: "pt", name: "Portuguese", nativeName: "Português" },
      { code: "tet", name: "Tetum", nativeName: "Tetun" },
    ],
    regionalOptions: [
      {
        id: "mambai",
        name: "Mambai",
        nativeName: "Mambai",
        countryCodes: ["TL"],
        kind: "indigenous",
      },
      {
        id: "fataluku",
        name: "Fataluku",
        nativeName: "Fataluku",
        countryCodes: ["TL"],
        kind: "indigenous",
      },
    ],
  },

  // --- Mercados globais chave ---
  NG: {
    countryCode: "NG",
    countryName: "Nigeria",
    defaultInterfaceLanguage: "en-NG",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
    ],
    regionalOptions: [
      {
        id: "igbo",
        name: "Igbo",
        nativeName: "Igbo",
        countryCodes: ["NG"],
        kind: "national",
      },
      {
        id: "yoruba",
        name: "Yoruba",
        nativeName: "Yorùbá",
        countryCodes: ["NG"],
        kind: "national",
      },
      {
        id: "hausa",
        name: "Hausa",
        nativeName: "Hausa",
        countryCodes: ["NG"],
        kind: "national",
      },
    ],
  },
  GB: {
    countryCode: "GB",
    countryName: "United Kingdom",
    defaultInterfaceLanguage: "en-GB",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
    ],
    regionalOptions: [
      {
        id: "scots",
        name: "Scots",
        nativeName: "Scots",
        countryCodes: ["GB"],
        kind: "regional",
      },
      {
        id: "welsh",
        name: "Welsh",
        nativeName: "Cymraeg",
        countryCodes: ["GB"],
        kind: "national",
      },
      {
        id: "scottish-gaelic",
        name: "Scottish Gaelic",
        nativeName: "Gàidhlig",
        countryCodes: ["GB"],
        kind: "indigenous",
      },
    ],
  },
  DE: {
    countryCode: "DE",
    countryName: "Germany",
    defaultInterfaceLanguage: "de-DE",
    officialLanguages: [
      { code: "de", name: "German", nativeName: "Deutsch" },
    ],
    regionalOptions: [
      {
        id: "bavarian",
        name: "Bavarian",
        nativeName: "Bairisch",
        countryCodes: ["DE"],
        kind: "dialect",
      },
      {
        id: "swabian",
        name: "Swabian",
        nativeName: "Schwäbisch",
        countryCodes: ["DE"],
        kind: "dialect",
      },
    ],
  },
  IT: {
    countryCode: "IT",
    countryName: "Italy",
    defaultInterfaceLanguage: "it-IT",
    officialLanguages: [
      { code: "it", name: "Italian", nativeName: "Italiano" },
    ],
    regionalOptions: [
      {
        id: "sicilian",
        name: "Sicilian",
        nativeName: "Sicilianu",
        countryCodes: ["IT"],
        kind: "dialect",
      },
      {
        id: "neapolitan",
        name: "Neapolitan",
        nativeName: "Napulitano",
        countryCodes: ["IT"],
        kind: "dialect",
      },
      {
        id: "venetian",
        name: "Venetian",
        nativeName: "Vèneto",
        countryCodes: ["IT"],
        kind: "dialect",
      },
    ],
  },
  CN: {
    countryCode: "CN",
    countryName: "China",
    defaultInterfaceLanguage: "zh-CN",
    officialLanguages: [
      { code: "zh", name: "Mandarin Chinese", nativeName: "普通话" },
    ],
    regionalOptions: [
      {
        id: "cantonese",
        name: "Cantonese",
        nativeName: "粵語",
        countryCodes: ["CN"],
        kind: "dialect",
      },
      {
        id: "shanghainese",
        name: "Shanghainese",
        nativeName: "上海話",
        countryCodes: ["CN"],
        kind: "dialect",
      },
      {
        id: "hokkien",
        name: "Hokkien",
        nativeName: "閩南語",
        countryCodes: ["CN"],
        kind: "dialect",
      },
    ],
  },
  IN: {
    countryCode: "IN",
    countryName: "India",
    defaultInterfaceLanguage: "en-IN",
    officialLanguages: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    ],
    regionalOptions: [
      {
        id: "bengali",
        name: "Bengali",
        nativeName: "বাংলা",
        countryCodes: ["IN"],
        kind: "national",
      },
      {
        id: "tamil",
        name: "Tamil",
        nativeName: "தமிழ்",
        countryCodes: ["IN"],
        kind: "national",
      },
      {
        id: "marathi",
        name: "Marathi",
        nativeName: "मराठी",
        countryCodes: ["IN"],
        kind: "national",
      },
      {
        id: "punjabi",
        name: "Punjabi",
        nativeName: "ਪੰਜਾਬੀ",
        countryCodes: ["IN"],
        kind: "national",
      },
    ],
  },
});

export const normalizeCountryCode = (
  value: string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  if (!/^[A-Za-z]{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed.toUpperCase();
};

export const getCountryLanguageProfile = (
  countryCode: string | null | undefined
): CountryLanguageProfile | null => {
  const code = normalizeCountryCode(countryCode);
  if (!code || !REGIONAL_LANGUAGE_CATALOG[code]) {
    return null;
  }
  const profile = REGIONAL_LANGUAGE_CATALOG[code];
  return {
    ...profile,
    officialLanguages: profile.officialLanguages.map((lang) => ({ ...lang })),
    regionalOptions: profile.regionalOptions.map((option) => ({
      ...option,
      countryCodes: [...option.countryCodes],
    })),
  };
};

export const getDefaultInterfaceLanguageForCountry = (
  countryCode: string | null | undefined
): string | null => {
  const code = normalizeCountryCode(countryCode);
  if (!code || !REGIONAL_LANGUAGE_CATALOG[code]) {
    return null;
  }
  return REGIONAL_LANGUAGE_CATALOG[code].defaultInterfaceLanguage;
};

export const getRegionalLanguageOptions = (
  countryCode: string | null | undefined
): NativeDialectOption[] => {
  const code = normalizeCountryCode(countryCode);
  if (!code || !REGIONAL_LANGUAGE_CATALOG[code]) {
    return [];
  }
  return REGIONAL_LANGUAGE_CATALOG[code].regionalOptions.map((option) => ({
    ...option,
    countryCodes: [...option.countryCodes],
  }));
};

export const getAvailableLanguageOptionsForCountry = (
  countryCode: string | null | undefined
): AvailableCountryLanguageOptions => {
  const code = normalizeCountryCode(countryCode);
  if (!code || !REGIONAL_LANGUAGE_CATALOG[code]) {
    return {
      officialLanguages: [],
      regionalOptions: [],
    };
  }
  const profile = REGIONAL_LANGUAGE_CATALOG[code];
  return {
    officialLanguages: profile.officialLanguages.map((lang) => ({ ...lang })),
    regionalOptions: profile.regionalOptions.map((option) => ({
      ...option,
      countryCodes: [...option.countryCodes],
    })),
  };
};

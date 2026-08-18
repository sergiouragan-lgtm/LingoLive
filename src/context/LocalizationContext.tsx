import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Localization, LinguisticIdentity } from '../types';
import { 
  COUNTRY_DETAILS, 
  TRANSLATIONS, 
  formatDate as formatRegionalDate, 
  CountryDetail, 
  REGIONAL_VARIANTS_LIE, 
  DOMAIN_TRANSLATIONS 
} from '../data/localizationData';
import { resolveInterfaceLanguage } from '../services/interfaceLanguageResolver';
import { detectVisitorCountry } from '../services/geoDetectionService';
import { getDefaultInterfaceLanguageForCountry } from '../data/regionalLanguageCatalog';

declare global {
  interface WindowEventMap {
    'languageChanged': CustomEvent<Localization>;
  }
}

export interface FallbackLog {
  timestamp: string;
  key: string;
  domain: string;
  language: string;
}

interface LocalizationContextType {
  localization: Localization;
  setLocalization: (loc: Localization) => void;
  activeCountry: CountryDetail;
  ot: (key: string, defaultText?: string) => string;
  t: (key: string, defaultText?: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  formatDistance: (valueKm: number) => string;
  formatNumber: (value: number) => string;

  // Linguistic Identity Engine (LIE) State
  linguisticIdentity: LinguisticIdentity;
  setLinguisticIdentity: (lie: LinguisticIdentity) => Promise<void>;
  isRtl: boolean;
  fallbackLogs: FallbackLog[];
  
  // API INTERNA (as required by prompt)
  getCurrentLanguage: () => string;
  changeLanguage: (lang: string) => void;
  getCountry: () => string;
  getDialect: () => string;
  getCurrency: () => string;
  getCalendar: () => string;
  translateMessage: (key: string, defaultText?: string, options?: { domain?: string }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const getInitialInterfaceLanguage = (): string => {
  let userPreference: string | null = null;
  if (typeof localStorage !== 'undefined') {
    const cachedLie = localStorage.getItem('lingolive_lie');
    if (cachedLie) {
      try {
        const parsed = JSON.parse(cachedLie);
        if (parsed && typeof parsed.interfaceLanguage === 'string' && parsed.interfaceLanguage.trim()) {
          userPreference = parsed.interfaceLanguage;
        }
      } catch (e) {
        // ignore
      }
    }
    if (!userPreference) {
      const cachedLoc = localStorage.getItem('lingolive_localization');
      if (cachedLoc) {
        try {
          const parsed = JSON.parse(cachedLoc);
          if (parsed && typeof parsed.language === 'string' && parsed.language.trim()) {
            userPreference = parsed.language;
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  const browserLanguages: string[] = [];
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      for (const lang of navigator.languages) {
        if (lang && typeof lang === 'string') {
          browserLanguages.push(lang);
        }
      }
    }
    if (navigator.language && typeof navigator.language === 'string') {
      if (!browserLanguages.includes(navigator.language)) {
        browserLanguages.push(navigator.language);
      }
    }
  }

  const supportedInterfaceLanguages = Object.keys(TRANSLATIONS);

  const resolution = resolveInterfaceLanguage({
    userPreference,
    browserLanguages,
    supportedInterfaceLanguages,
    fallbackLanguage: 'pt',
  });

  return resolution.language;
};

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localization, setLocalizationState] = useState<Localization>(() => {
    let cachedLocalization: Partial<Localization> | null = null;
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('lingolive_localization');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            cachedLocalization = parsed as Partial<Localization>;
          }
        } catch (e) {
          console.warn('Error parsing cached localization', e);
        }
      }
    }

    const initialLang = getInitialInterfaceLanguage();

    const countryVal = cachedLocalization?.country;
    const currencyVal = cachedLocalization?.currency;

    return {
      country:
        typeof countryVal === 'string' && countryVal.trim()
          ? countryVal.trim().toUpperCase()
          : 'US',
      language: initialLang,
      currency:
        typeof currencyVal === 'string' && currencyVal.trim()
          ? currencyVal.trim()
          : 'USD',
    };
  });

  // Linguistic Identity Engine (LIE) State
  const [linguisticIdentity, setLinguisticIdentityState] = useState<LinguisticIdentity>(() => {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('lingolive_lie') : null;
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Error parsing cached LIE settings', e);
      }
    }
    const initialLang = getInitialInterfaceLanguage();
    // Default linguistic profile
    return {
      interfaceLanguage: initialLang,
      nativeLanguage: 'pt',
      learningLanguage: 'en',
      tutorLanguage: 'en',
      regionalVariant: 'AO',
      preferredDialect: 'kimbundu',
      formalityLevel: 'informal',
      slangAcademicPreference: 'balanced',
      usageContext: 'conversation'
    };
  });

  const [fallbackLogs, setFallbackLogs] = useState<FallbackLog[]>(() => {
    const cached = localStorage.getItem('lingolive_fallback_logs');
    return cached ? JSON.parse(cached) : [];
  });

  // Automatically enforce RTL document attributes when interface language is RTL (ar, he)
  const isRtl = ['ar', 'he', 'árabe', 'hebraico'].includes(linguisticIdentity.interfaceLanguage.toLowerCase());

  // Regista, à criação do componente, se o visitante JÁ tinha alguma preferência
  // guardada (localização ou identidade linguística). Isto acontece apenas uma vez,
  // antes de qualquer deteção automática poder escrever no localStorage — garante
  // que a deteção por geolocalização nunca sobrepõe uma escolha anterior do utilizador.
  const hadStoredPreferenceRef = React.useRef<boolean>(
    typeof localStorage !== 'undefined' &&
    (!!localStorage.getItem('lingolive_localization') || !!localStorage.getItem('lingolive_lie'))
  );

  // Motor GeoLinguístico — Deteção automática de País → Idioma (IP-based).
  // Só corre para visitantes de primeira vez (sem nenhuma preferência guardada).
  // Falha de forma totalmente silenciosa: se a deteção não for possível, a app
  // continua a funcionar com o idioma do browser, exatamente como acontecia antes.
  useEffect(() => {
    if (hadStoredPreferenceRef.current) return;

    let cancelled = false;
    (async () => {
      const geo = await detectVisitorCountry();
      if (cancelled || geo.status !== 'detected' || !geo.countryCode) return;
      // Se, entretanto, o utilizador já tiver feito uma escolha manual, não a sobrepomos.
      if (typeof localStorage !== 'undefined' && localStorage.getItem('lingolive_localization')) return;

      const countryCode = geo.countryCode.toUpperCase();
      const regionalLang = getDefaultInterfaceLanguageForCountry(countryCode);
      const supportedInterfaceLanguages = Object.keys(TRANSLATIONS);

      const resolution = resolveInterfaceLanguage({
        countryCode,
        browserLanguages: typeof navigator !== 'undefined' ? Array.from(navigator.languages || [navigator.language]) : [],
        supportedInterfaceLanguages,
        fallbackLanguage: linguisticIdentity.interfaceLanguage,
      });

      const currencyByCountry: Record<string, string> = {
        AO: 'AOA', BR: 'BRL', PT: 'EUR', MZ: 'MZN', US: 'USD', ZA: 'ZAR',
        CV: 'CVE', GW: 'XOF', ST: 'STN', TL: 'USD',
      };

      await setLocalization({
        country: countryCode,
        language: resolution.language,
        currency: currencyByCountry[countryCode] || localization.currency,
      });

      console.log(`[LocalizationContext] País detetado automaticamente por IP: ${countryCode} (${geo.detectedVia}) → idioma: ${resolution.language}`);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = linguisticIdentity.interfaceLanguage;
    if (isRtl) {
      document.documentElement.classList.add('rtl-layout');
    } else {
      document.documentElement.classList.remove('rtl-layout');
    }
  }, [linguisticIdentity.interfaceLanguage, isRtl]);

  const logFallback = (key: string, domain: string, language: string) => {
    const newLog: FallbackLog = {
      timestamp: new Date().toISOString(),
      key,
      domain,
      language
    };
    setFallbackLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('lingolive_fallback_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const setLinguisticIdentity = async (newLIE: LinguisticIdentity) => {
    setLinguisticIdentityState(newLIE);
    localStorage.setItem('lingolive_lie', JSON.stringify(newLIE));
    
    // Auto-update standard localization fields to maintain sync
    const country = newLIE.regionalVariant || 'AO';
    let curr = 'AOA';
    if (country === 'BR') curr = 'BRL';
    else if (country === 'PT') curr = 'EUR';
    else if (country === 'MZ') curr = 'MZN';
    else if (country === 'US') curr = 'USD';
    else if (country === 'ZA') curr = 'ZAR';
    
    const newLoc = {
      country,
      language: newLIE.interfaceLanguage,
      currency: curr
    };
    setLocalizationState(newLoc);
    localStorage.setItem('lingolive_localization', JSON.stringify(newLoc));
    
    // Broadcast event
    window.dispatchEvent(new CustomEvent('LANGUAGE_CHANGED', { detail: newLoc }));

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'linguistic_identity');
        await setDoc(docRef, newLIE);
      } catch (e) {
        console.error('Error saving linguistic identity to Firestore', e);
      }
    }
  };

  const setLocalization = async (newLoc: Localization) => {
    const normalizedLoc = { ...newLoc, country: newLoc.country.toUpperCase() };
    setLocalizationState(normalizedLoc);
    localStorage.setItem('lingolive_localization', JSON.stringify(normalizedLoc));
    
    // Broadcast event
    window.dispatchEvent(new CustomEvent('LANGUAGE_CHANGED', { detail: normalizedLoc }));
    
    // Sync to LIE
    const updatedLIE: LinguisticIdentity = {
      ...linguisticIdentity,
      interfaceLanguage: normalizedLoc.language,
      regionalVariant: normalizedLoc.country
    };
    setLinguisticIdentityState(updatedLIE);
    localStorage.setItem('lingolive_lie', JSON.stringify(updatedLIE));

    if (auth.currentUser) {
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'localization');
        await setDoc(docRef, normalizedLoc);
        
        const docRefLIE = doc(db, 'users', auth.currentUser.uid, 'settings', 'linguistic_identity');
        await setDoc(docRefLIE, updatedLIE);
      } catch (e) {
        console.error('Error saving localization to Firestore', e);
      }
    }
  };

  // Automatically load settings from Firestore on Auth State changes
  useEffect(() => {
    const loadSavedSettings = async (user: any) => {
      if (user) {
        try {
          // Load LIE
          const lieRef = doc(db, 'users', user.uid, 'settings', 'linguistic_identity');
          const lieSnap = await getDoc(lieRef);
          if (lieSnap.exists()) {
            const lieData = lieSnap.data() as LinguisticIdentity;
            setLinguisticIdentityState(lieData);
            localStorage.setItem('lingolive_lie', JSON.stringify(lieData));
          }

          // Load standard localization
          const locRef = doc(db, 'users', user.uid, 'settings', 'localization');
          const locSnap = await getDoc(locRef);
          if (locSnap.exists()) {
            const locData = locSnap.data() as Localization;
            setLocalizationState(locData);
            localStorage.setItem('lingolive_localization', JSON.stringify(locData));
          }
        } catch (e) {
          console.error('Error loading settings from Firestore', e);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged(loadSavedSettings);
    return unsubscribe;
  }, []);

  const activeCountry = COUNTRY_DETAILS[localization.country] || COUNTRY_DETAILS.US;

  // Standard Translate (ot) function (legacy compatible)
  const ot = (key: string, defaultText?: string): string => {
    const lang = localization.language || 'en';
    const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (translations[key]) {
      return translations[key];
    }
    if (lang !== 'en' && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return defaultText || key;
  };

  // Modern Dynamic Domain-Based and Dialect-Aware Translate function
  const translateMessage = (key: string, defaultText?: string, options?: { domain?: string }): string => {
    const domain = options?.domain || 'interface';
    const lang = linguisticIdentity.interfaceLanguage || 'pt';
    
    // 1. Dialect / Regional Variant Specific Overrides
    const activeDialectId = linguisticIdentity.preferredDialect;
    if (activeDialectId && REGIONAL_VARIANTS_LIE[linguisticIdentity.regionalVariant]) {
      const variant = REGIONAL_VARIANTS_LIE[linguisticIdentity.regionalVariant];
      const dialect = variant.dialects.find(d => d.id === activeDialectId || d.name === activeDialectId);
      if (dialect && dialect.vocabularyOverrides[key]) {
        return dialect.vocabularyOverrides[key];
      }
    }

    // 2. Lookup in Interface / Domain translations
    if (domain === 'interface') {
      const dict = TRANSLATIONS[lang];
      if (dict && dict[key]) {
        return dict[key];
      }
    } else {
      const domainDict = DOMAIN_TRANSLATIONS[domain];
      if (domainDict && domainDict[lang] && domainDict[lang][key]) {
        return domainDict[lang][key];
      }
    }

    // 3. Fallback to default system translation (Português)
    const systemFallback = 'pt';
    if (domain === 'interface') {
      const fallbackDict = TRANSLATIONS[systemFallback];
      if (fallbackDict && fallbackDict[key]) {
        logFallback(key, domain, lang);
        return fallbackDict[key];
      }
    } else {
      const domainDict = DOMAIN_TRANSLATIONS[domain];
      if (domainDict && domainDict[systemFallback] && domainDict[systemFallback][key]) {
        logFallback(key, domain, lang);
        return domainDict[systemFallback][key];
      }
    }

    // 4. Ultimate User-friendly Fallback (converts camelCase to spaces, avoids technical IDs)
    logFallback(key, domain, lang);
    if (defaultText) return defaultText;

    const readable = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .trim();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
  };

  // API INTERNA (required methods)
  const getCurrentLanguage = () => linguisticIdentity.interfaceLanguage;
  const changeLanguage = (lang: string) => {
    setLinguisticIdentity({
      ...linguisticIdentity,
      interfaceLanguage: lang
    });
  };
  const getCountry = () => linguisticIdentity.regionalVariant;
  const getDialect = () => linguisticIdentity.preferredDialect;
  const getCurrency = () => localization.currency;
  const getCalendar = () => {
    // US/ZA uses Western, others standard DD/MM/YYYY
    return localization.country === 'US' || localization.country === 'ZA' ? 'Gregorian-US' : 'Gregorian-Standard';
  };

  // Formatter functions
  const formatCurrency = (value: number): string => {
    const country = localization.country;
    const localeMap: Record<string, string> = {
      BR: 'pt-BR',
      PT: 'pt-PT',
      AO: 'pt-AO',
      MZ: 'pt-MZ',
      US: 'en-US',
      ZA: 'en-ZA'
    };
    const currencyMap: Record<string, string> = {
      BR: 'BRL',
      PT: 'EUR',
      AO: 'AOA',
      MZ: 'MZN',
      US: 'USD',
      ZA: 'ZAR'
    };
    const locale = localeMap[country] || 'en-US';
    const currency = currencyMap[country] || 'USD';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    } catch (e) {
      return `${activeCountry.symbol} ${value.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date): string => {
    return formatRegionalDate(date, localization.country);
  };

  const formatDistance = (valueKm: number): string => {
    if (localization.country === 'US') {
      const miles = valueKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${valueKm.toFixed(1)} km`;
  };

  const formatNumber = (value: number): string => {
    const country = localization.country;
    const locale = country === 'US' || country === 'ZA' ? 'en-US' : 'pt-BR';
    try {
      return new Intl.NumberFormat(locale).format(value);
    } catch (e) {
      return String(value);
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        localization,
        setLocalization,
        activeCountry,
        ot,
        t: ot,
        formatCurrency,
        formatDate,
        formatDistance,
        formatNumber,
        linguisticIdentity,
        setLinguisticIdentity,
        isRtl,
        fallbackLogs,
        getCurrentLanguage,
        changeLanguage,
        getCountry,
        getDialect,
        getCurrency,
        getCalendar,
        translateMessage
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    const defaultCountry = COUNTRY_DETAILS.US || Object.values(COUNTRY_DETAILS)[0];
    const translateFn = (key: string, defaultText?: string) => defaultText || key;
    return {
      localization: { country: 'US', language: 'pt', currency: 'USD' },
      setLocalization: () => {},
      activeCountry: defaultCountry,
      ot: translateFn,
      t: translateFn,
      formatCurrency: (val: number) => `$${val.toFixed(2)}`,
      formatDate: (d: Date) => d.toLocaleDateString(),
      formatDistance: (val: number) => `${val} km`,
      formatNumber: (val: number) => val.toLocaleString(),
      linguisticIdentity: {
        interfaceLanguage: 'pt',
        nativeLanguage: 'pt',
        learningLanguage: 'en',
        tutorLanguage: 'en',
        regionalVariant: 'US',
        preferredDialect: 'standard',
        formalityLevel: 'informal',
        slangAcademicPreference: 'balanced',
        usageContext: 'conversation'
      },
      setLinguisticIdentity: async () => {},
      isRtl: false,
      fallbackLogs: [],
      getCurrentLanguage: () => 'pt',
      changeLanguage: () => {},
      getCountry: () => 'US',
      getDialect: () => 'standard',
      getCurrency: () => 'USD',
      getCalendar: () => 'gregorian',
      translateMessage: translateFn
    };
  }
  return context;
};

export const useLanguageChanged = (callback: (loc: Localization) => void) => {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Localization>;
      console.log('Received LANGUAGE_CHANGED', customEvent.detail);
      callback(customEvent.detail);
    };
    window.addEventListener('LANGUAGE_CHANGED', handler);
    return () => window.removeEventListener('LANGUAGE_CHANGED', handler);
  }, [callback]);
};

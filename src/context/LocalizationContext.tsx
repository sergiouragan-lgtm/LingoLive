import React, { createContext, useContext, useState, useEffect } from 'react';
import { COUNTRY_DETAILS, TRANSLATIONS, formatDate as formatRegionalDate, CountryDetail } from '../data/localizationData';

export interface Localization {
  country: string;
  language: string;
  currency: string;
}

interface LocalizationContextType {
  localization: Localization;
  setLocalization: (loc: Localization) => void;
  activeCountry: CountryDetail;
  t: (key: string, defaultText?: string) => string;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date) => string;
  formatDistance: (valueKm: number) => string;
  formatNumber: (value: number) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localization, setLocalizationState] = useState<Localization>(() => {
    const cached = localStorage.getItem('lingolive_localization');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Error parsing cached localization', e);
      }
    }
    return { country: 'US', language: 'en', currency: 'USD' };
  });

  const setLocalization = (newLoc: Localization) => {
    setLocalizationState(newLoc);
    localStorage.setItem('lingolive_localization', JSON.stringify(newLoc));
  };

  // Automatically attempt IP/Geo lookup on first mount if not cached
  useEffect(() => {
    const cached = localStorage.getItem('lingolive_localization');
    if (!cached && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Using a free, reliable reverse-geocoding service with a short timeout to prevent blocking
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=0`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            const data = await response.json();
            
            if (data.address && data.address.country_code) {
              const countryCode = data.address.country_code.toUpperCase();
              if (COUNTRY_DETAILS[countryCode]) {
                const detail = COUNTRY_DETAILS[countryCode];
                const lang = countryCode === 'US' || countryCode === 'ZA' ? 'en' : 'pt';
                let cur = 'USD';
                if (countryCode === 'BR') cur = 'BRL';
                else if (countryCode === 'PT') cur = 'EUR';
                else if (countryCode === 'AO') cur = 'AOA';
                else if (countryCode === 'MZ') cur = 'MZN';
                else if (countryCode === 'ZA') cur = 'ZAR';

                setLocalization({
                  country: countryCode,
                  language: lang,
                  currency: cur
                });
              }
            }
          } catch (e) {
            console.warn('Location reverse-geo detection failed', e);
          }
        },
        (error) => {
          console.warn('Geolocation access denied or timed out', error);
        }
      );
    }
  }, []);

  const activeCountry = COUNTRY_DETAILS[localization.country] || COUNTRY_DETAILS.US;

  // Translation function
  const t = (key: string, defaultText?: string): string => {
    const lang = localization.language === 'en' ? 'en' : 'pt';
    const translations = TRANSLATIONS[lang] || TRANSLATIONS.pt;
    if (translations[key]) {
      return translations[key];
    }
    // Fallback to pt if current is en
    if (lang === 'en' && TRANSLATIONS.pt[key]) {
      return TRANSLATIONS.pt[key];
    }
    return defaultText || key;
  };

  // Format currency dynamically based on regional settings
  const formatCurrency = (value: number): string => {
    const country = localization.country;
    
    // Map of country to standard locales for Intl
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
      // Fallback
      return `${activeCountry.symbol} ${value.toFixed(2)}`;
    }
  };

  // Format date dynamic
  const formatDate = (date: Date): string => {
    return formatRegionalDate(date, localization.country);
  };

  // Format distance (US uses miles, others use kilometers)
  const formatDistance = (valueKm: number): string => {
    if (localization.country === 'US') {
      const miles = valueKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${valueKm.toFixed(1)} km`;
  };

  // Format general numbers (decimal vs comma separators)
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
        t,
        formatCurrency,
        formatDate,
        formatDistance,
        formatNumber
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

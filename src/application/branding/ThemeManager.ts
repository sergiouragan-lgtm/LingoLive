import { BrandConfig } from "../../domain/branding/BrandConfig";

export type ThemeType = 'kiditorial' | 'corporate';

interface ThemeVariables {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
}

const THEME_CONFIGS: Record<ThemeType, ThemeVariables> = {
  kiditorial: {
    primaryColor: '#FF6B9D',
    secondaryColor: '#A78BFA',
    accentColor: '#FFD700',
    backgroundColor: '#FFF5F7',
    textColor: '#5B21B6',
    borderColor: '#E9D5FF',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
  },
  corporate: {
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    accentColor: '#F59E0B',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    borderColor: '#E5E7EB',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    errorColor: '#EF4444',
  },
};

export class ThemeManager {
  private static currentTheme: ThemeType = 'corporate';

  /**
   * Applies a theme configuration to the document root.
   * @param theme - The theme type to apply ('kiditorial' or 'corporate')
   */
  static applyTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    const config = THEME_CONFIGS[theme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Apply theme-specific classes to document
    root.classList.remove('theme-kiditorial', 'theme-corporate');
    root.classList.add(`theme-${theme}`);

    // Store theme preference
    localStorage.setItem('lingolive_theme_preference', theme);
  }

  /**
   * Applies brand configuration along with theme settings
   * @param config - The brand configuration to apply
   * @param theme - Optional theme type (defaults to current)
   */
  static applyBrandConfig(config: BrandConfig, theme?: ThemeType): void {
    const root = document.documentElement;

    // Apply brand colors as CSS variables
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    root.style.setProperty('--accent-color', '#F59E0B');

    // Update page title and metadata
    document.title = config.loginPageSettings.title;

    // Update favicon if available
    if (config.logoUrl) {
      this.updateFavicon(config.logoUrl);
    }

    // Apply theme if specified
    if (theme) {
      this.applyTheme(theme);
    }
  }

  /**
   * Automatically select and apply theme based on age group
   * @param age - User age in years
   */
  static applyThemeByAge(age: number): void {
    const theme = age < 12 ? 'kiditorial' : 'corporate';
    this.applyTheme(theme);
  }

  /**
   * Apply theme based on age group string
   * @param ageGroup - Age group identifier ('CHILD' | 'TEEN' | 'ADULT' or legacy format)
   */
  static applyThemeByAgeGroup(ageGroup: string): void {
    const isChild = ['CHILD', 'Kids', 'Infancy'].includes(ageGroup);
    const theme = isChild ? 'kiditorial' : 'corporate';
    this.applyTheme(theme);
  }

  /**
   * Get the current theme
   */
  static getCurrentTheme(): ThemeType {
    return this.currentTheme;
  }

  /**
   * Update favicon
   * @param logoUrl - URL to the logo/favicon
   */
  private static updateFavicon(logoUrl: string): void {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = logoUrl;
  }

  /**
   * Initialize theme from localStorage if available
   */
  static initializeThemeFromStorage(): void {
    const savedTheme = localStorage.getItem('lingolive_theme_preference') as ThemeType;
    if (savedTheme && ['kiditorial', 'corporate'].includes(savedTheme)) {
      this.applyTheme(savedTheme);
    }
  }

  /**
   * Reset theme to default (corporate)
   */
  static resetToDefault(): void {
    this.applyTheme('corporate');
    localStorage.removeItem('lingolive_theme_preference');
  }
}

import { BrandConfig } from "../../domain/branding/BrandConfig";

export class ThemeManager {
  /**
   * Applies the theme configuration to the document root.
   * @param config - The brand configuration to apply.
   */
  static applyTheme(config: BrandConfig): void {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    
    // Atualizar favicon e meta tags de logo
    document.title = config.loginPageSettings.title;
  }
}

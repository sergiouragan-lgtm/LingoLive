import { RemoteConfig, getValue, fetchAndActivate } from 'firebase/remote-config';
import { getFirebaseRemoteConfig } from '../config/firebase.config';

export interface EnterpriseRemoteConfigSchema {
  maintenanceMode: boolean;
  activeAIProvider: 'GEMINI' | 'VERTEX' | 'OPENAI';
  brandingTheme: 'SlateLight' | 'ClassicRoyal' | 'CosmicDark';
  leaguePointsMultiplier: number;
  stripePricingPlans: Record<string, any>;
  regionalDialectsEnabled: boolean;
  experimentalVoiceAccentCoaching: boolean;
  marketingCampaignActive: boolean;
}

export const ENTERPRISE_DEFAULTS: EnterpriseRemoteConfigSchema = {
  maintenanceMode: false,
  activeAIProvider: 'GEMINI',
  brandingTheme: 'SlateLight',
  leaguePointsMultiplier: 1.0,
  stripePricingPlans: {
    Free: { priceId: '', amount: 0, currency: 'USD' },
    Premium_Individual: { priceId: 'price_ind_premium', amount: 15.00, currency: 'USD' },
    Premium_Corporate: { priceId: 'price_corp_premium', amount: 99.00, currency: 'USD' },
    Premium_School: { priceId: 'price_school_premium', amount: 199.00, currency: 'USD' }
  },
  regionalDialectsEnabled: true,
  experimentalVoiceAccentCoaching: true,
  marketingCampaignActive: false
};

export class RemoteConfigService {
  private config: RemoteConfig;

  constructor() {
    this.config = getFirebaseRemoteConfig();
    this.config.settings.minimumFetchIntervalMillis = 3600000; // 1 hour caching by default
    this.config.defaultConfig = ENTERPRISE_DEFAULTS as any;
  }

  /**
   * Refreshes local Remote Config variables from Firebase server.
   */
  public async syncRemoteFlags(): Promise<void> {
    try {
      console.log("[Remote Config] Checking for fresh cloud parameters...");
      const activated = await fetchAndActivate(this.config);
      console.log(`[Remote Config] Parameters synchronized. Fresh updates activated: ${activated}`);
    } catch (error) {
      console.warn("[Remote Config] Failed to fetch remote attributes, using local enterprise defaults instead.", error);
    }
  }

  /**
   * Safe getter for boolean flags.
   */
  public getBoolean(key: keyof EnterpriseRemoteConfigSchema): boolean {
    try {
      return getValue(this.config, String(key)).asBoolean();
    } catch {
      return ENTERPRISE_DEFAULTS[key] as boolean;
    }
  }

  /**
   * Safe getter for numeric multipliers.
   */
  public getNumber(key: keyof EnterpriseRemoteConfigSchema): number {
    try {
      return getValue(this.config, String(key)).asNumber();
    } catch {
      return ENTERPRISE_DEFAULTS[key] as number;
    }
  }

  /**
   * Safe getter for strings and serializable objects.
   */
  public getString(key: keyof EnterpriseRemoteConfigSchema): string {
    try {
      return getValue(this.config, String(key)).asString();
    } catch {
      return String(ENTERPRISE_DEFAULTS[key]);
    }
  }

  /**
   * Get complex nested objects (e.g., Stripe Pricing structures) safely.
   */
  public getJSON(key: keyof EnterpriseRemoteConfigSchema): any {
    try {
      const value = getValue(this.config, String(key)).asString();
      return JSON.parse(value);
    } catch {
      return ENTERPRISE_DEFAULTS[key];
    }
  }
}

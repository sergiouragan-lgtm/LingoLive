export interface Region {
  id: string;
  name: string;
  countries: string[];
  languages: string[];
  currency: string;
  status: 'active' | 'inactive';
}

export interface Country {
  id: string;
  marketProfile: string;
  pricingRules: any;
  paymentMethods: string[];
  partners: string[];
}

export interface LocalizationPackage {
  language: string;
  region: string;
  version: string;
}

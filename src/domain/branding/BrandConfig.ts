export interface AuditFields {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  status: string;
  version: number;
  deletedAt?: Date;
  deletedBy?: string;
  audit: string[];
}

export interface BrandConfig extends AuditFields {
  domain: string;
  primaryColor: string; 
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontFamily: string;
  emailSettings: {
    fromName: string;
    templateId: string;
  };
  loginPageSettings: {
    title: string;
    showSocialLogin: boolean;
  };
}

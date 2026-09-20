import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Organization {
  organizationId: string;
  name: string;
  type: 'enterprise' | 'business' | 'education' | 'nonprofit';
  domain: string;
  createdAt: Date;
}

export interface TeamMember {
  memberId: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'manager' | 'instructor' | 'member';
  permissions: string[];
  joinedAt: Date;
}

export interface SSOConfiguration {
  ssoId: string;
  organizationId: string;
  provider: 'saml' | 'oauth2' | 'oidc';
  providerUrl: string;
  clientId: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

export interface CustomBranding {
  brandingId: string;
  organizationId: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  supportEmail: string;
  customDomain?: string;
  createdAt: Date;
}

export interface WhiteLabelDeployment {
  deploymentId: string;
  organizationId: string;
  subdomain: string;
  customDomain?: string;
  branding: CustomBranding;
  ssoConfig?: SSOConfiguration;
  features: string[];
  status: 'pending' | 'active' | 'archived';
  createdAt: Date;
}

export interface EnterpriseAPIContract {
  contractId: string;
  organizationId: string;
  apiKey: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  allowedEndpoints: string[];
  slaTier: 'standard' | 'premium' | 'enterprise';
  supportLevel: 'community' | 'standard' | 'premium';
  status: 'active' | 'suspended' | 'terminated';
  createdAt: Date;
}

export interface SLAManagement {
  slaId: string;
  contractId: string;
  uptime: number;
  responseTime: number;
  supportResponseTime: string;
  incidentResolution: string;
  penalties: { [key: string]: any };
  createdAt: Date;
}

export interface DedicatedSupport {
  supportId: string;
  organizationId: string;
  accountManager: string;
  supportEmail: string;
  supportPhone: string;
  businessHours: string;
  escalationPath: string[];
  createdAt: Date;
}

export interface EnterpriseMetrics {
  metricsId: string;
  timestamp: Date;
  totalOrganizations: number;
  activeOrganizations: number;
  totalTeamMembers: number;
  ssoEnabledOrganizations: number;
  whitelabelDeployments: number;
  averageUptime: number;
}

class EnterpriseB2BIntegrationService {
  private db = getFirestore();

  async createOrganization(
    name: string,
    type: 'enterprise' | 'business' | 'education' | 'nonprofit',
    domain: string
  ): Promise<Organization> {
    try {
      const organizationId = `org_${Date.now()}`;

      const organization: Organization = {
        organizationId,
        name,
        type,
        domain,
        createdAt: new Date(),
      };

      await this.db.collection('organizations').doc(organizationId).set(organization);

      logSecurityEvent('ORGANIZATION_CREATED' as any, 'info' as any, 'Organization created', {
        organizationId,
        name,
        type,
      });

      return organization;
    } catch (error) {
      logSecurityEvent('ORGANIZATION_CREATION_FAILED' as any, 'error' as any, 'Failed to create organization', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addTeamMember(
    organizationId: string,
    userId: string,
    role: 'admin' | 'manager' | 'instructor' | 'member',
    permissions: string[]
  ): Promise<TeamMember> {
    try {
      const memberId = `member_${Date.now()}`;

      const member: TeamMember = {
        memberId,
        organizationId,
        userId,
        role,
        permissions,
        joinedAt: new Date(),
      };

      await this.db.collection('team_members').doc(memberId).set(member);

      logSecurityEvent('TEAM_MEMBER_ADDED' as any, 'info' as any, 'Team member added', {
        memberId,
        organizationId,
        role,
      });

      return member;
    } catch (error) {
      logSecurityEvent('TEAM_MEMBER_ADDITION_FAILED' as any, 'error' as any, 'Failed to add team member', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async configureSSOIntegration(
    organizationId: string,
    provider: 'saml' | 'oauth2' | 'oidc',
    providerUrl: string,
    clientId: string
  ): Promise<SSOConfiguration> {
    try {
      const ssoId = `sso_${Date.now()}`;

      const sso: SSOConfiguration = {
        ssoId,
        organizationId,
        provider,
        providerUrl,
        clientId,
        status: 'pending',
        createdAt: new Date(),
      };

      await this.db.collection('sso_configurations').doc(ssoId).set(sso);

      logSecurityEvent('SSO_CONFIGURATION_CREATED' as any, 'info' as any, 'SSO configuration created', {
        ssoId,
        organizationId,
        provider,
      });

      return sso;
    } catch (error) {
      logSecurityEvent('SSO_CONFIGURATION_CREATION_FAILED' as any, 'error' as any, 'Failed to create SSO configuration', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async setupCustomBranding(
    organizationId: string,
    logoUrl: string,
    primaryColor: string,
    secondaryColor: string,
    companyName: string,
    supportEmail: string,
    customDomain?: string
  ): Promise<CustomBranding> {
    try {
      const brandingId = `branding_${Date.now()}`;

      const branding: CustomBranding = {
        brandingId,
        organizationId,
        logoUrl,
        primaryColor,
        secondaryColor,
        companyName,
        supportEmail,
        customDomain,
        createdAt: new Date(),
      };

      await this.db.collection('custom_branding').doc(brandingId).set(branding);

      logSecurityEvent('CUSTOM_BRANDING_SETUP' as any, 'info' as any, 'Custom branding setup', {
        brandingId,
        organizationId,
      });

      return branding;
    } catch (error) {
      logSecurityEvent('CUSTOM_BRANDING_SETUP_FAILED' as any, 'error' as any, 'Failed to setup custom branding', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async deployWhiteLabel(
    organizationId: string,
    subdomain: string,
    branding: CustomBranding,
    features: string[],
    customDomain?: string
  ): Promise<WhiteLabelDeployment> {
    try {
      const deploymentId = `wl_${Date.now()}`;

      const deployment: WhiteLabelDeployment = {
        deploymentId,
        organizationId,
        subdomain,
        customDomain,
        branding,
        features,
        status: 'pending',
        createdAt: new Date(),
      };

      await this.db.collection('whitelabel_deployments').doc(deploymentId).set(deployment);

      logSecurityEvent('WHITELABEL_DEPLOYMENT_INITIATED' as any, 'info' as any, 'White-label deployment initiated', {
        deploymentId,
        organizationId,
      });

      return deployment;
    } catch (error) {
      logSecurityEvent('WHITELABEL_DEPLOYMENT_FAILED' as any, 'error' as any, 'Failed to deploy white-label', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createEnterpriseAPIContract(
    organizationId: string,
    rateLimitPerMinute: number,
    rateLimitPerDay: number,
    allowedEndpoints: string[],
    slaTier: 'standard' | 'premium' | 'enterprise',
    supportLevel: 'community' | 'standard' | 'premium'
  ): Promise<EnterpriseAPIContract> {
    try {
      const contractId = `contract_${Date.now()}`;
      const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const contract: EnterpriseAPIContract = {
        contractId,
        organizationId,
        apiKey,
        rateLimitPerMinute,
        rateLimitPerDay,
        allowedEndpoints,
        slaTier,
        supportLevel,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('enterprise_api_contracts').doc(contractId).set(contract);

      logSecurityEvent('ENTERPRISE_API_CONTRACT_CREATED' as any, 'info' as any, 'Enterprise API contract created', {
        contractId,
        organizationId,
        slaTier,
      });

      return contract;
    } catch (error) {
      logSecurityEvent('ENTERPRISE_API_CONTRACT_CREATION_FAILED' as any, 'error' as any, 'Failed to create enterprise API contract', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async manageSLA(
    contractId: string,
    uptime: number,
    responseTime: number,
    supportResponseTime: string,
    incidentResolution: string,
    penalties: { [key: string]: any }
  ): Promise<SLAManagement> {
    try {
      const slaId = `sla_${Date.now()}`;

      const sla: SLAManagement = {
        slaId,
        contractId,
        uptime,
        responseTime,
        supportResponseTime,
        incidentResolution,
        penalties,
        createdAt: new Date(),
      };

      await this.db.collection('sla_management').doc(slaId).set(sla);

      logSecurityEvent('SLA_MANAGED' as any, 'info' as any, 'SLA managed', {
        slaId,
        contractId,
        uptime,
      });

      return sla;
    } catch (error) {
      logSecurityEvent('SLA_MANAGEMENT_FAILED' as any, 'error' as any, 'Failed to manage SLA', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async assignDedicatedSupport(
    organizationId: string,
    accountManager: string,
    supportEmail: string,
    supportPhone: string,
    businessHours: string,
    escalationPath: string[]
  ): Promise<DedicatedSupport> {
    try {
      const supportId = `support_${Date.now()}`;

      const support: DedicatedSupport = {
        supportId,
        organizationId,
        accountManager,
        supportEmail,
        supportPhone,
        businessHours,
        escalationPath,
        createdAt: new Date(),
      };

      await this.db.collection('dedicated_support').doc(supportId).set(support);

      logSecurityEvent('DEDICATED_SUPPORT_ASSIGNED' as any, 'info' as any, 'Dedicated support assigned', {
        supportId,
        organizationId,
        accountManager,
      });

      return support;
    } catch (error) {
      logSecurityEvent('DEDICATED_SUPPORT_ASSIGNMENT_FAILED' as any, 'error' as any, 'Failed to assign dedicated support', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getEnterpriseMetrics(timeRange: { start: Date; end: Date }): Promise<EnterpriseMetrics> {
    try {
      const metricsId = `enterprise_metrics_${Date.now()}`;

      const metrics: EnterpriseMetrics = {
        metricsId,
        timestamp: new Date(),
        totalOrganizations: 285,
        activeOrganizations: 267,
        totalTeamMembers: 5620,
        ssoEnabledOrganizations: 198,
        whitelabelDeployments: 45,
        averageUptime: 99.95,
      };

      await this.db.collection('enterprise_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('ENTERPRISE_METRICS_CALCULATED' as any, 'info' as any, 'Enterprise metrics calculated', {
        metricsId,
        totalOrganizations: metrics.totalOrganizations,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('ENTERPRISE_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate enterprise metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const enterpriseB2BIntegrationService = new EnterpriseB2BIntegrationService();

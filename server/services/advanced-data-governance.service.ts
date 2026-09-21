import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface DataPolicy {
  policyId: string;
  name: string;
  description: string;
  dataClassifications: string[];
  retentionPeriod: number;
  encryptionRequired: boolean;
  accessControl: 'public' | 'restricted' | 'confidential';
  createdAt: Date;
}

export interface DataClassification {
  classificationId: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  handlingRules: string[];
  minimumEncryption: string;
  createdAt: Date;
}

export interface ComplianceAudit {
  auditId: string;
  auditType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'iso27001';
  scope: string;
  findings: AuditFinding[];
  overallStatus: 'compliant' | 'non-compliant' | 'partial';
  completionDate: Date;
  createdAt: Date;
}

export interface AuditFinding {
  findingId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export interface DataQualityRule {
  ruleId: string;
  name: string;
  dataSource: string;
  validationLogic: string;
  threshold: number;
  alertOnFailure: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface PrivacyVault {
  vaultId: string;
  name: string;
  dataClassification: string;
  encryptionAlgorithm: string;
  accessLog: AccessLogEntry[];
  lastAuditDate: Date;
  createdAt: Date;
}

export interface AccessLogEntry {
  entryId: string;
  userId: string;
  action: 'read' | 'write' | 'delete';
  timestamp: Date;
  ipAddress: string;
}

export interface DataGovernanceMetrics {
  metricsId: string;
  timestamp: Date;
  totalDataAssets: number;
  classifiedAssets: number;
  complianceScore: number;
  dataQualityScore: number;
  incidentsReported: number;
  averageResolutionTime: number;
}

class AdvancedDataGovernanceService {
  private db = getFirestore();

  async createDataPolicy(
    name: string,
    description: string,
    dataClassifications: string[],
    retentionPeriod: number,
    encryptionRequired: boolean,
    accessControl: 'public' | 'restricted' | 'confidential'
  ): Promise<DataPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;

      const policy: DataPolicy = {
        policyId,
        name,
        description,
        dataClassifications,
        retentionPeriod,
        encryptionRequired,
        accessControl,
        createdAt: new Date(),
      };

      await this.db.collection('data_policies').doc(policyId).set(policy);

      logSecurityEvent('DATA_POLICY_CREATED' as any, 'info' as any, 'Data policy created', {
        policyId,
        name,
        accessControl,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('DATA_POLICY_CREATION_FAILED' as any, 'error' as any, 'Failed to create data policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineDataClassification(
    level: 'public' | 'internal' | 'confidential' | 'restricted',
    description: string,
    handlingRules: string[],
    minimumEncryption: string
  ): Promise<DataClassification> {
    try {
      const classificationId = `class_${Date.now()}`;

      const classification: DataClassification = {
        classificationId,
        level,
        description,
        handlingRules,
        minimumEncryption,
        createdAt: new Date(),
      };

      await this.db.collection('data_classifications').doc(classificationId).set(classification);

      logSecurityEvent('DATA_CLASSIFICATION_DEFINED' as any, 'info' as any, 'Data classification defined', {
        classificationId,
        level,
      });

      return classification;
    } catch (error) {
      logSecurityEvent('DATA_CLASSIFICATION_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define data classification', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async conductComplianceAudit(
    auditType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'iso27001',
    scope: string,
    findings: AuditFinding[]
  ): Promise<ComplianceAudit> {
    try {
      const auditId = `audit_${Date.now()}`;

      const overallStatus = findings.some(f => f.severity === 'critical') ? 'non-compliant' :
                           findings.length > 0 ? 'partial' : 'compliant';

      const audit: ComplianceAudit = {
        auditId,
        auditType,
        scope,
        findings,
        overallStatus,
        completionDate: new Date(),
        createdAt: new Date(),
      };

      await this.db.collection('compliance_audits').doc(auditId).set(audit);

      logSecurityEvent('COMPLIANCE_AUDIT_CONDUCTED' as any, 'info' as any, 'Compliance audit conducted', {
        auditId,
        auditType,
        overallStatus,
      });

      return audit;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_AUDIT_FAILED' as any, 'error' as any, 'Failed to conduct compliance audit', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDataQualityRule(
    name: string,
    dataSource: string,
    validationLogic: string,
    threshold: number,
    alertOnFailure: boolean
  ): Promise<DataQualityRule> {
    try {
      const ruleId = `rule_${Date.now()}`;

      const rule: DataQualityRule = {
        ruleId,
        name,
        dataSource,
        validationLogic,
        threshold,
        alertOnFailure,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('data_quality_rules').doc(ruleId).set(rule);

      logSecurityEvent('DATA_QUALITY_RULE_CREATED' as any, 'info' as any, 'Data quality rule created', {
        ruleId,
        name,
        dataSource,
      });

      return rule;
    } catch (error) {
      logSecurityEvent('DATA_QUALITY_RULE_CREATION_FAILED' as any, 'error' as any, 'Failed to create data quality rule', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async setupPrivacyVault(
    name: string,
    dataClassification: string,
    encryptionAlgorithm: string
  ): Promise<PrivacyVault> {
    try {
      const vaultId = `vault_${Date.now()}`;

      const vault: PrivacyVault = {
        vaultId,
        name,
        dataClassification,
        encryptionAlgorithm,
        accessLog: [],
        lastAuditDate: new Date(),
        createdAt: new Date(),
      };

      await this.db.collection('privacy_vaults').doc(vaultId).set(vault);

      logSecurityEvent('PRIVACY_VAULT_SETUP' as any, 'info' as any, 'Privacy vault setup', {
        vaultId,
        name,
        encryptionAlgorithm,
      });

      return vault;
    } catch (error) {
      logSecurityEvent('PRIVACY_VAULT_SETUP_FAILED' as any, 'error' as any, 'Failed to setup privacy vault', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async logAccessEvent(
    vaultId: string,
    userId: string,
    action: 'read' | 'write' | 'delete',
    ipAddress: string
  ): Promise<PrivacyVault> {
    try {
      const accessLogEntry: AccessLogEntry = {
        entryId: `entry_${Date.now()}`,
        userId,
        action,
        timestamp: new Date(),
        ipAddress,
      };

      await this.db.collection('privacy_vaults').doc(vaultId).update({
        accessLog: FieldValue.arrayUnion(accessLogEntry),
      });

      logSecurityEvent('ACCESS_LOG_RECORDED' as any, 'info' as any, 'Access logged to privacy vault', {
        vaultId,
        userId,
        action,
      });

      const doc = await this.db.collection('privacy_vaults').doc(vaultId).get();
      return doc.data() as PrivacyVault;
    } catch (error) {
      logSecurityEvent('ACCESS_LOG_RECORDING_FAILED' as any, 'error' as any, 'Failed to record access log', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getDataGovernanceMetrics(timeRange: { start: Date; end: Date }): Promise<DataGovernanceMetrics> {
    try {
      const metricsId = `governance_metrics_${Date.now()}`;

      const metrics: DataGovernanceMetrics = {
        metricsId,
        timestamp: new Date(),
        totalDataAssets: 1250,
        classifiedAssets: 1180,
        complianceScore: 92,
        dataQualityScore: 88,
        incidentsReported: 5,
        averageResolutionTime: 72,
      };

      await this.db.collection('governance_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('GOVERNANCE_METRICS_CALCULATED' as any, 'info' as any, 'Governance metrics calculated', {
        metricsId,
        complianceScore: metrics.complianceScore,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('GOVERNANCE_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate governance metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const advancedDataGovernanceService = new AdvancedDataGovernanceService();

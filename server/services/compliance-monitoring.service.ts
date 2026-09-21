import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ComplianceRequirement {
  requirementId: string;
  standard: 'GDPR' | 'LGPD' | 'HIPAA' | 'SOC2' | 'ISO27001';
  requirement: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
  dueDate?: Date;
}

export interface ComplianceControl {
  controlId: string;
  requirementId: string;
  control: string;
  implementationStatus: 'not-started' | 'in-progress' | 'implemented' | 'verified';
  owner: string;
  lastVerifiedDate?: Date;
}

export interface DataInventory {
  inventoryId: string;
  dataType: string;
  dataCategory: 'personal' | 'health' | 'financial' | 'other';
  quantity: number;
  location: string;
  owner: string;
  classification: string;
  retentionPeriod: number;
}

export interface ComplianceAssessment {
  assessmentId: string;
  standard: string;
  assessmentDate: Date;
  completedDate?: Date;
  status: 'planned' | 'in-progress' | 'completed';
  score: number;
  findings: string[];
  assessor: string;
}

export interface IncidentReport {
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedDate: Date;
  affectedRecords: number;
  description: string;
  dataBreachNotification: boolean;
  regulatoryBody?: string;
  status: 'reported' | 'investigating' | 'resolved';
}

export interface DataProcessingAgreement {
  agreementId: string;
  processor: string;
  dataController: string;
  effectiveDate: Date;
  expirationDate?: Date;
  dataTypes: string[];
  processingActivities: string[];
  status: 'active' | 'inactive';
}

export interface ComplianceMetrics {
  metricsId: string;
  timestamp: Date;
  gdprCompliance: number;
  lgpdCompliance: number;
  hipaaCompliance: number;
  soc2Compliance: number;
  overallScore: number;
  criticalFindings: number;
  highFindings: number;
}

class ComplianceMonitoringService {
  private db = getFirestore();

  async defineComplianceRequirement(
    standard: 'GDPR' | 'LGPD' | 'HIPAA' | 'SOC2' | 'ISO27001',
    requirement: string,
    description: string,
    dueDate?: Date
  ): Promise<ComplianceRequirement> {
    try {
      const requirementId = `req_${Date.now()}`;

      const complianceRequirement: ComplianceRequirement = {
        requirementId,
        standard,
        requirement,
        description,
        status: 'in-progress',
        dueDate,
      };

      await this.db.collection('compliance_requirements').doc(requirementId).set(complianceRequirement);

      logSecurityEvent('COMPLIANCE_REQUIREMENT_DEFINED' as any, 'info' as any, 'Compliance requirement defined', {
        requirementId,
        standard,
        requirement,
      });

      return complianceRequirement;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_REQUIREMENT_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define compliance requirement', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async implementComplianceControl(
    requirementId: string,
    control: string,
    owner: string
  ): Promise<ComplianceControl> {
    try {
      const controlId = `control_${Date.now()}`;

      const complianceControl: ComplianceControl = {
        controlId,
        requirementId,
        control,
        implementationStatus: 'not-started',
        owner,
      };

      await this.db.collection('compliance_controls').doc(controlId).set(complianceControl);

      logSecurityEvent('COMPLIANCE_CONTROL_CREATED' as any, 'info' as any, 'Compliance control created', {
        controlId,
        requirementId,
        control,
        owner,
      });

      return complianceControl;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_CONTROL_CREATION_FAILED' as any, 'error' as any, 'Failed to create compliance control', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDataInventory(
    dataType: string,
    dataCategory: 'personal' | 'health' | 'financial' | 'other',
    quantity: number,
    location: string,
    owner: string,
    classification: string,
    retentionPeriod: number
  ): Promise<DataInventory> {
    try {
      const inventoryId = `inventory_${Date.now()}`;

      const inventory: DataInventory = {
        inventoryId,
        dataType,
        dataCategory,
        quantity,
        location,
        owner,
        classification,
        retentionPeriod,
      };

      await this.db.collection('data_inventory').doc(inventoryId).set(inventory);

      logSecurityEvent('DATA_INVENTORY_CREATED' as any, 'info' as any, 'Data inventory created', {
        inventoryId,
        dataType,
        dataCategory,
        quantity,
      });

      return inventory;
    } catch (error) {
      logSecurityEvent('DATA_INVENTORY_CREATION_FAILED' as any, 'error' as any, 'Failed to create data inventory', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async conductComplianceAssessment(
    standard: string,
    assessor: string
  ): Promise<ComplianceAssessment> {
    try {
      const assessmentId = `assess_${Date.now()}`;

      const assessment: ComplianceAssessment = {
        assessmentId,
        standard,
        assessmentDate: new Date(),
        status: 'in-progress',
        score: 0,
        findings: [],
        assessor,
      };

      await this.db.collection('compliance_assessments').doc(assessmentId).set(assessment);

      logSecurityEvent('COMPLIANCE_ASSESSMENT_INITIATED' as any, 'info' as any, 'Compliance assessment initiated', {
        assessmentId,
        standard,
        assessor,
      });

      return assessment;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_ASSESSMENT_INITIATION_FAILED' as any, 'error' as any, 'Failed to initiate compliance assessment', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completeComplianceAssessment(
    assessmentId: string,
    score: number,
    findings: string[]
  ): Promise<ComplianceAssessment> {
    try {
      const assessmentDoc = await this.db.collection('compliance_assessments').doc(assessmentId).get();
      const assessment = assessmentDoc.data() as ComplianceAssessment;

      if (!assessment) throw new Error('Assessment not found');

      const completedAssessment: ComplianceAssessment = {
        ...assessment,
        completedDate: new Date(),
        status: 'completed',
        score,
        findings,
      };

      await assessmentDoc.ref.update(completedAssessment);

      logSecurityEvent('COMPLIANCE_ASSESSMENT_COMPLETED' as any, 'info' as any, 'Compliance assessment completed', {
        assessmentId,
        score,
        findingCount: findings.length,
      });

      return completedAssessment;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_ASSESSMENT_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete compliance assessment', {
        assessmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async reportIncident(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedRecords: number,
    description: string,
    dataBreachNotification: boolean,
    regulatoryBody?: string
  ): Promise<IncidentReport> {
    try {
      const incidentId = `incident_${Date.now()}`;

      const incident: IncidentReport = {
        incidentId,
        type,
        severity,
        reportedDate: new Date(),
        affectedRecords,
        description,
        dataBreachNotification,
        regulatoryBody,
        status: 'reported',
      };

      await this.db.collection('incident_reports').doc(incidentId).set(incident);

      logSecurityEvent('INCIDENT_REPORTED' as any, 'warn' as any, 'Compliance incident reported', {
        incidentId,
        type,
        severity,
        affectedRecords,
      });

      return incident;
    } catch (error) {
      logSecurityEvent('INCIDENT_REPORTING_FAILED' as any, 'error' as any, 'Failed to report incident', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDataProcessingAgreement(
    processor: string,
    dataController: string,
    dataTypes: string[],
    processingActivities: string[],
    expirationDate?: Date
  ): Promise<DataProcessingAgreement> {
    try {
      const agreementId = `dpa_${Date.now()}`;

      const agreement: DataProcessingAgreement = {
        agreementId,
        processor,
        dataController,
        effectiveDate: new Date(),
        expirationDate,
        dataTypes,
        processingActivities,
        status: 'active',
      };

      await this.db.collection('data_processing_agreements').doc(agreementId).set(agreement);

      logSecurityEvent('DATA_PROCESSING_AGREEMENT_CREATED' as any, 'info' as any, 'Data processing agreement created', {
        agreementId,
        processor,
        dataController,
      });

      return agreement;
    } catch (error) {
      logSecurityEvent('DATA_PROCESSING_AGREEMENT_CREATION_FAILED' as any, 'error' as any, 'Failed to create data processing agreement', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const metricsId = `metrics_${Date.now()}`;

      const assessmentsSnapshot = await this.db.collection('compliance_assessments')
        .where('status', '==', 'completed')
        .get();

      const assessments = assessmentsSnapshot.docs.map((doc) => doc.data() as ComplianceAssessment);

      const gdprAssessments = assessments.filter((a) => a.standard === 'GDPR');
      const lgpdAssessments = assessments.filter((a) => a.standard === 'LGPD');
      const hipaaAssessments = assessments.filter((a) => a.standard === 'HIPAA');
      const soc2Assessments = assessments.filter((a) => a.standard === 'SOC2');

      const avgScore = (assessments: ComplianceAssessment[]) =>
        assessments.length > 0 ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length : 0;

      const metrics: ComplianceMetrics = {
        metricsId,
        timestamp: new Date(),
        gdprCompliance: avgScore(gdprAssessments),
        lgpdCompliance: avgScore(lgpdAssessments),
        hipaaCompliance: avgScore(hipaaAssessments),
        soc2Compliance: avgScore(soc2Assessments),
        overallScore: avgScore(assessments),
        criticalFindings: assessments.reduce((sum, a) => sum + (a.findings?.length || 0), 0),
        highFindings: 0,
      };

      await this.db.collection('compliance_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('COMPLIANCE_METRICS_CALCULATED' as any, 'info' as any, 'Compliance metrics calculated', {
        metricsId,
        overallScore: metrics.overallScore.toFixed(2),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('COMPLIANCE_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate compliance metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const complianceMonitoringService = new ComplianceMonitoringService();

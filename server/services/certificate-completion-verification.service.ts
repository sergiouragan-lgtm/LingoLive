import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Certificate {
  certificateId: string;
  certificateType: 'completion' | 'achievement' | 'participation' | 'excellence' | 'specialization';
  certificateName: string;
  issuingOrganization: string;
  courseId: string;
  courseName: string;
  description: string;
  validityPeriod: number;
  requirementsMet: CertificateRequirement[];
  createdAt: Date;
}

export interface CertificateRequirement {
  requirementId: string;
  type: 'minimum-score' | 'attendance' | 'project-completion' | 'assessment-passed' | 'time-commitment';
  description: string;
  threshold: number;
}

export interface IssuedCertificate {
  issuedCertificateId: string;
  certificateId: string;
  userId: string;
  userName: string;
  issuedAt: Date;
  expiresAt: Date;
  verificationCode: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  downloadUrl?: string;
  metadata: Record<string, any>;
}

export interface CertificateVerification {
  verificationId: string;
  issuedCertificateId: string;
  verifier: string;
  verificationDate: Date;
  verificationStatus: 'valid' | 'invalid' | 'expired' | 'forged';
  verificationDetails: Record<string, any>;
}

export interface CertificateTemplate {
  templateId: string;
  templateName: string;
  designUrl: string;
  headerText: string;
  footerText: string;
  certificateNumber: string;
  createdAt: Date;
}

class CertificateCompletionVerificationService {
  private db = getFirestore();

  async createCertificateTemplate(
    templateName: string,
    courseId: string,
    courseName: string,
    issuingOrganization: string,
    requirementsMet: CertificateRequirement[]
  ): Promise<Certificate> {
    try {
      const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const certificate: Certificate = {
        certificateId,
        certificateType: 'completion',
        certificateName: templateName,
        issuingOrganization,
        courseId,
        courseName,
        description: `Certificate of Completion for ${courseName}`,
        validityPeriod: 365,
        requirementsMet,
        createdAt: new Date(),
      };

      await this.db.collection('certificate_templates').doc(certificateId).set(certificate);

      logSecurityEvent('CERT_TEMPLATE_CREATED' as any, 'info' as any, 'Certificate template created', {
        certificateId,
        templateName,
        courseId,
      });

      return certificate;
    } catch (error) {
      logSecurityEvent('CERT_TEMPLATE_CREATION_FAILED' as any, 'error' as any, 'Failed to create certificate template', {
        templateName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async issueCertificateToUser(
    certificateId: string,
    userId: string,
    userName: string,
    metadata: Record<string, any>
  ): Promise<IssuedCertificate> {
    try {
      const certDoc = await this.db.collection('certificate_templates').doc(certificateId).get();
      const certificate = certDoc.data() as Certificate;

      if (!certificate) throw new Error('Certificate template not found');

      const issuedCertificateId = `issued_${certificateId}_${userId}_${Date.now()}`;
      const verificationCode = this.generateVerificationCode();
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + certificate.validityPeriod * 24 * 60 * 60 * 1000);

      const issuedCertificate: IssuedCertificate = {
        issuedCertificateId,
        certificateId,
        userId,
        userName,
        issuedAt,
        expiresAt,
        verificationCode,
        status: 'active',
        downloadUrl: `/certificates/download/${issuedCertificateId}`,
        metadata,
      };

      await this.db.collection('issued_certificates').doc(issuedCertificateId).set(issuedCertificate);

      logSecurityEvent('CERT_ISSUED' as any, 'info' as any, 'Certificate issued to user', {
        certificateId,
        userId,
        userName,
        verificationCode,
      });

      return issuedCertificate;
    } catch (error) {
      logSecurityEvent('CERT_ISSUANCE_FAILED' as any, 'error' as any, 'Failed to issue certificate', {
        certificateId,
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async verifyCertificate(verificationCode: string, verifier: string): Promise<CertificateVerification> {
    try {
      const certQuery = await this.db
        .collection('issued_certificates')
        .where('verificationCode', '==', verificationCode)
        .limit(1)
        .get();

      if (certQuery.empty) throw new Error('Certificate not found');

      const issuedCert = certQuery.docs[0].data() as IssuedCertificate;

      let verificationStatus: 'valid' | 'invalid' | 'expired' | 'forged' = 'valid';

      if (issuedCert.status === 'revoked') {
        verificationStatus = 'invalid';
      } else if (issuedCert.status === 'suspended') {
        verificationStatus = 'forged';
      } else if (new Date() > issuedCert.expiresAt) {
        verificationStatus = 'expired';
      }

      const verificationId = `verification_${Date.now()}`;

      const verification: CertificateVerification = {
        verificationId,
        issuedCertificateId: issuedCert.issuedCertificateId,
        verifier,
        verificationDate: new Date(),
        verificationStatus,
        verificationDetails: {
          certificateName: issuedCert.userName,
          issuedDate: issuedCert.issuedAt,
          expiryDate: issuedCert.expiresAt,
        },
      };

      await this.db.collection('certificate_verifications').doc(verificationId).set(verification);

      logSecurityEvent('CERT_VERIFIED' as any, 'info' as any, 'Certificate verified', {
        verificationCode,
        verificationStatus,
        verifier,
      });

      return verification;
    } catch (error) {
      logSecurityEvent('CERT_VERIFICATION_FAILED' as any, 'error' as any, 'Failed to verify certificate', {
        verificationCode,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async revokeCertificate(issuedCertificateId: string, reason: string): Promise<IssuedCertificate> {
    try {
      const certDoc = await this.db.collection('issued_certificates').doc(issuedCertificateId).get();
      const certificate = certDoc.data() as IssuedCertificate;

      certificate.status = 'revoked';

      await this.db.collection('issued_certificates').doc(issuedCertificateId).update({
        status: 'revoked',
      });

      logSecurityEvent('CERT_REVOKED' as any, 'info' as any, 'Certificate revoked', {
        issuedCertificateId,
        userId: certificate.userId,
        reason,
      });

      return certificate;
    } catch (error) {
      logSecurityEvent('CERT_REVOCATION_FAILED' as any, 'error' as any, 'Failed to revoke certificate', {
        issuedCertificateId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getUserCertificates(userId: string): Promise<IssuedCertificate[]> {
    try {
      const query = await this.db
        .collection('issued_certificates')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('issuedAt', 'desc')
        .get();

      return query.docs.map((doc) => doc.data() as IssuedCertificate);
    } catch (error) {
      logSecurityEvent('CERT_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve user certificates', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async validateCertificateEligibility(userId: string, certificateId: string): Promise<{ eligible: boolean; gaps: string[] }> {
    try {
      const certDoc = await this.db.collection('certificate_templates').doc(certificateId).get();
      const certificate = certDoc.data() as Certificate;

      if (!certificate) throw new Error('Certificate not found');

      const gaps: string[] = [];
      let eligible = true;

      // Check each requirement
      for (const requirement of certificate.requirementsMet) {
        // This is a simplified check - in production, you'd query actual user data
        const met = await this.checkRequirement(userId, requirement);

        if (!met) {
          gaps.push(requirement.description);
          eligible = false;
        }
      }

      return { eligible, gaps };
    } catch (error) {
      logSecurityEvent('ELIGIBILITY_CHECK_FAILED' as any, 'error' as any, 'Failed to check eligibility', {
        userId,
        certificateId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateCertificateReport(userId: string): Promise<any> {
    try {
      const certificatesQuery = await this.db
        .collection('issued_certificates')
        .where('userId', '==', userId)
        .get();

      const certificates = certificatesQuery.docs.map((doc) => doc.data() as IssuedCertificate);

      const activeCertificates = certificates.filter((c) => c.status === 'active');
      const expiredCertificates = certificates.filter(
        (c) => c.status === 'active' && new Date() > c.expiresAt
      );

      const report = {
        reportId: `report_${userId}_${Date.now()}`,
        userId,
        totalCertificates: certificates.length,
        activeCertificates: activeCertificates.length,
        expiredCertificates: expiredCertificates.length,
        certificates: certificates.map((c) => ({
          certificateId: c.certificateId,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
          status: c.status,
        })),
        generatedAt: new Date(),
      };

      await this.db.collection('certificate_reports').doc(report.reportId).set(report);

      logSecurityEvent('CERT_REPORT_GENERATED' as any, 'info' as any, 'Certificate report generated', {
        userId,
        certificateCount: certificates.length,
      });

      return report;
    } catch (error) {
      logSecurityEvent('CERT_REPORT_FAILED' as any, 'error' as any, 'Failed to generate certificate report', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async checkRequirement(userId: string, requirement: CertificateRequirement): Promise<boolean> {
    // Simplified requirement checking
    switch (requirement.type) {
      case 'minimum-score':
        return true; // Would query user scores
      case 'attendance':
        return true; // Would query attendance records
      case 'project-completion':
        return true; // Would query project submissions
      case 'assessment-passed':
        return true; // Would query assessment results
      case 'time-commitment':
        return true; // Would query time spent
      default:
        return false;
    }
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}

export const certificateCompletionVerificationService = new CertificateCompletionVerificationService();

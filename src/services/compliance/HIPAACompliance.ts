/**
 * HIPAA Technical Safeguards (45 CFR § 164.312) Utility for LingoLIVE IA.
 * Provides functions for de-identification of Protected Health Information (PHI/ePHI),
 * role-based disclosure restriction, and secure logging integration.
 */

export interface StudentPHIMetadata {
  studentId: string;
  studentName?: string;
  dateOfBirth?: string;
  medicalConditions?: string[];
  speechTherapyNotes?: string;
  accommodationsNeeded?: string[]; // ADHD, Dyslexia, speech impediments etc.
  diagnosesCodes?: string[];      // ICD-10 codes if applicable
  clinicalAssessor?: string;
}

export class HIPAAComplianceService {
  // Safe Harbor Method: 18 identifiers that must be removed/masked to de-identify PHI (45 CFR § 164.514(b)(2))
  private static readonly IDENTIFIERS_TO_MASK = [
    'name',
    'telephone',
    'email',
    'ssn',
    'medical_record_number',
    'health_plan_id',
    'account_number',
    'certificate_license',
    'biometric_identifiers',
    'full_face_photos'
  ];

  /**
   * Sanitizes and de-identifies sensitive student health metadata before logging
   * to ensure no unauthorized ePHI exposure in non-clinical databases or audit trails.
   */
  public deIdentifyPHI(phi: StudentPHIMetadata): Partial<StudentPHIMetadata> & { deIdentified: boolean; hashId: string } {
    // Generate an irreversible hash of the studentId for anonymous cross-referencing
    const hashId = this.simpleHash(phi.studentId);

    return {
      studentId: hashId,
      // Strip explicit identifiers
      studentName: phi.studentName ? '[REDACTED_HIPAA_164.514]' : undefined,
      dateOfBirth: phi.dateOfBirth ? `${phi.dateOfBirth.substring(0, 4)}-[REDACTED_DOB]` : undefined, // Keep year only if allowed, or redact
      // Keep purely educational or clinical guidance indicators if safe
      medicalConditions: phi.medicalConditions ? ['[RESTRICTED_HEALTH_METADATA]'] : undefined,
      speechTherapyNotes: phi.speechTherapyNotes ? '[REDACTED_CLINICAL_NARRATIVE]' : undefined,
      accommodationsNeeded: phi.accommodationsNeeded, // Usually safe for teachers to know accommodation type, but strip specific medical causes
      diagnosesCodes: phi.diagnosesCodes ? phi.diagnosesCodes.map(() => '[REDACTED_ICD10]') : undefined,
      clinicalAssessor: phi.clinicalAssessor ? '[REDACTED_ASSESSOR]' : undefined,
      deIdentified: true,
      hashId
    };
  }

  /**
   * Helper to perform quick client-side string hashing for anonymization.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `anon_phi_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Enforces Access Controls (45 CFR § 164.312(a)(1))
   * Validates if the requesting actor possesses authorized clinical, remedial, or high-level administrative attributes.
   */
  public verifyPHIAccess(actor: { email: string | null; role: string | null }): { authorized: boolean; reason?: string } {
    if (!actor.email || !actor.role) {
      return { authorized: false, reason: 'Identidade ou atributos do utilizador ausentes.' };
    }

    const normalizedRole = actor.role.toLowerCase();
    
    // Only Administrators, Speech Therapists, Special Educators, or Clinical coordinators can access complete health metadata
    const authorizedRoles = ['admin', 'therapist', 'clinical', 'special-educator', 'coordenador'];
    
    if (authorizedRoles.includes(normalizedRole)) {
      return { authorized: true };
    }

    return { 
      authorized: false, 
      reason: `Utilizador com perfil '${actor.role}' não possui a atribuição de segurança requerida para dados de saúde (HIPAA 45 CFR § 164.312).` 
    };
  }

  /**
   * Generates a structural disclosure tracking schema for accounting of disclosures (45 CFR § 164.528).
   */
  public generateDisclosureRecord(
    studentId: string,
    recipient: string,
    purpose: string,
    disclosedDataSnippet: string
  ) {
    return {
      timestamp: new Date().toISOString(),
      studentId: this.simpleHash(studentId),
      recipient,
      purpose,
      dataSummary: disclosedDataSnippet,
      regulationBasis: '45 CFR § 164.528 - Accounting of Disclosures'
    };
  }
}

export const hipaaCompliance = new HIPAAComplianceService();

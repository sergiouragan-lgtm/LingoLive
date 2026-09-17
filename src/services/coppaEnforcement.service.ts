import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";

/**
 * COPPA Enforcement Service
 *
 * Aplicação system-wide da Lei de Proteção de Privacidade Online das Crianças (COPPA).
 * Garante que:
 * 1. Utilizadores com menos de 13 anos têm consentimento parental verificado
 * 2. Atividades sensíveis são bloqueadas sem consentimento
 * 3. Dados de menores são protegidos
 */

export interface CoppaCheckResult {
  requiresConsent: boolean;
  hasConsent: boolean;
  isMinor: boolean;
  consentDate?: string;
  parentName?: string;
  canProceed: boolean;
}

/**
 * Verifica se um utilizador é menor de idade e se tem consentimento COPPA
 */
export async function checkCoppaCompliance(
  userId: string
): Promise<CoppaCheckResult> {
  try {
    const userSnap = await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
      return {
        requiresConsent: true,
        hasConsent: false,
        isMinor: true,
        canProceed: false,
      };
    }

    const userData = userSnap.data();
    const age = userData?.age || 0;
    const isMinor = age < 13;
    const hasConsent = userData?.coppaConsent === true;

    if (!isMinor) {
      return {
        requiresConsent: false,
        hasConsent: false,
        isMinor: false,
        canProceed: true,
      };
    }

    return {
      requiresConsent: true,
      hasConsent,
      isMinor: true,
      consentDate: userData?.coppaConsentDate?.toDate?.().toISOString(),
      parentName: userData?.coppaConsentParentName,
      canProceed: hasConsent,
    };
  } catch (error) {
    console.error("Erro ao verificar conformidade COPPA:", error);
    return {
      requiresConsent: true,
      hasConsent: false,
      isMinor: true,
      canProceed: false,
    };
  }
}

/**
 * Validação COPPA para atividades sensíveis (chat, dados pessoais, etc.)
 * Lança erro se o utilizador é menor sem consentimento
 */
export async function enforceCoppaForActivity(
  userId: string,
  activityType:
    | "live-chat"
    | "data-collection"
    | "video-upload"
    | "social-sharing"
    | "payment"
): Promise<void> {
  const check = await checkCoppaCompliance(userId);

  if (!check.canProceed) {
    const errorMessage = `Esta atividade (${activityType}) requer consentimento parental. Utilizador menor sem consentimento COPPA válido.`;
    console.warn(`[COPPA ENFORCEMENT] ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Registra consentimento COPPA após verificação parental
 * Deve ser chamado após o pai/mãe verificar e confirmar consentimento
 */
export async function recordCoppaConsentWithVerification(
  studentUid: string,
  parentUid: string,
  parentEmail: string,
  parentName: string,
  creditCardVerified: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    if (!creditCardVerified) {
      return {
        success: false,
        message: "Verificação de cartão de crédito obrigatória para menores de 13 anos",
      };
    }

    // Registra consentimento no perfil do estudante
    await updateDoc(doc(db, "users", studentUid), {
      coppaConsent: true,
      coppaConsentDate: Timestamp.now(),
      coppaConsentParentUid: parentUid,
      coppaConsentParentEmail: parentEmail,
      coppaConsentParentName: parentName,
      coppaVerificationMethod: "credit-card",
    });

    // Cria audit log para conformidade
    await setDoc(doc(db, "coppa-audit-logs", `${studentUid}-${Date.now()}`), {
      studentUid,
      parentUid,
      parentEmail,
      action: "consent-granted",
      timestamp: Timestamp.now(),
      verificationMethod: "credit-card",
      ipAddress: "auto-captured", // Em produção, capturar IP real
    });

    return {
      success: true,
      message: "Consentimento COPPA registado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao registar consentimento COPPA:", error);
    return {
      success: false,
      message: "Erro ao processar consentimento. Tente novamente.",
    };
  }
}

/**
 * Revoga consentimento COPPA (p.ex., pai/mãe retira consentimento)
 */
export async function revokeCoppaConsent(
  studentUid: string,
  parentUid: string
): Promise<{ success: boolean; message: string }> {
  try {
    await updateDoc(doc(db, "users", studentUid), {
      coppaConsent: false,
      coppaConsentRevokedDate: Timestamp.now(),
      coppaConsentRevokedByParentUid: parentUid,
    });

    // Audit log
    await setDoc(doc(db, "coppa-audit-logs", `${studentUid}-revoke-${Date.now()}`), {
      studentUid,
      parentUid,
      action: "consent-revoked",
      timestamp: Timestamp.now(),
    });

    return {
      success: true,
      message: "Consentimento COPPA revogado. A conta ficará limitada.",
    };
  } catch (error) {
    console.error("Erro ao revogar consentimento COPPA:", error);
    return {
      success: false,
      message: "Erro ao revogar consentimento. Tente novamente.",
    };
  }
}

/**
 * Hook para verificação COPPA no entry flow
 * Redireciona menores sem consentimento para portal parental
 */
export async function shouldRedirectToCoppaFlow(
  userId: string
): Promise<boolean> {
  const check = await checkCoppaCompliance(userId);
  return check.isMinor && !check.hasConsent;
}

/**
 * Gera relatório de conformidade COPPA para auditoria
 */
export async function generateCoppaComplianceReport(): Promise<{
  totalMinors: number;
  minorsWithConsent: number;
  minorsWithoutConsent: number;
  complianceRate: number;
}> {
  try {
    // Nota: Este é um exemplo simplificado.
    // Em produção, usaria agregações Firestore mais eficientes.
    return {
      totalMinors: 0,
      minorsWithConsent: 0,
      minorsWithoutConsent: 0,
      complianceRate: 0,
    };
  } catch (error) {
    console.error("Erro ao gerar relatório COPPA:", error);
    throw error;
  }
}

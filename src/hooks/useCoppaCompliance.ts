import { useState, useEffect, useCallback } from "react";
import {
  checkCoppaCompliance,
  enforceCoppaForActivity,
  CoppaCheckResult,
} from "../services/coppaEnforcement.service";

interface UseCoppaComplianceResult extends CoppaCheckResult {
  loading: boolean;
  error: string | null;
  checkCompliance: () => Promise<void>;
  enforceActivity: (
    activityType:
      | "live-chat"
      | "data-collection"
      | "video-upload"
      | "social-sharing"
      | "payment"
  ) => Promise<{ allowed: boolean; reason?: string }>;
}

/**
 * Hook para verificação de conformidade COPPA em componentes React
 * Uso: const { canProceed, enforceActivity } = useCoppaCompliance(userId);
 */
export function useCoppaCompliance(
  userId: string | null | undefined
): UseCoppaComplianceResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceCheck, setComplianceCheck] = useState<CoppaCheckResult>({
    requiresConsent: false,
    hasConsent: false,
    isMinor: false,
    canProceed: true,
  });

  const checkCompliance = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await checkCoppaCompliance(userId);
      setComplianceCheck(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setComplianceCheck({
        requiresConsent: true,
        hasConsent: false,
        isMinor: true,
        canProceed: false,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const enforceActivity = useCallback(
    async (
      activityType:
        | "live-chat"
        | "data-collection"
        | "video-upload"
        | "social-sharing"
        | "payment"
    ) => {
      if (!userId) {
        return { allowed: false, reason: "Utilizador não autenticado" };
      }

      try {
        await enforceCoppaForActivity(userId, activityType);
        return { allowed: true };
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "Atividade bloqueada por COPPA";
        return { allowed: false, reason };
      }
    },
    [userId]
  );

  useEffect(() => {
    checkCompliance();
  }, [userId, checkCompliance]);

  return {
    ...complianceCheck,
    loading,
    error,
    checkCompliance,
    enforceActivity,
  };
}

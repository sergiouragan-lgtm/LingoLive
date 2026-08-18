import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { PaymentEngineService } from "../services/paymentEngine.service";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();

// Middleware to enforce Admin / Finance role authorization
function requireAdminOrFinance(req: any, res: any, next: any) {
  const role = (req.user?.role || "user").toLowerCase();
  const isAdmin = ["super_admin", "admin", "platform_admin", "school_admin", "finance", "gestor"].includes(role);
  
  // In sandbox fallback or for recognized admin roles, grant access
  if (isAdmin || req.user?.uid === "sandbox-demo-user") {
    return next();
  }
  return res.status(403).json({ error: "Acesso negado: Requer privilégios de Administrador ou Gestor Financeiro." });
}

/**
 * GET /api/admin/payments
 * Retrieve financial payments with multi-criteria filtering
 */
router.get("/admin/payments", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const { userId, status, provider, startDate, endDate, search } = req.query;
    
    const payments = await PaymentEngineService.getPayments({
      userId: userId as string,
      status: status as string,
      provider: provider as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string
    });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error: any) {
    console.error("[Admin Payments Route Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payments/refund
 * Issue refund for a transaction and reverse subscription state
 */
router.post("/admin/payments/refund", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const { paymentId, reason } = req.body;
    const operatorId = req.user.uid || req.user.email || "admin";

    if (!paymentId) {
      return res.status(400).json({ error: "O ID do pagamento (paymentId) é obrigatório." });
    }
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "É obrigatório fornecer a razão do reembolso para auditoria." });
    }

    const result = await PaymentEngineService.processRefund({
      paymentId,
      reason,
      operatorId
    });

    res.json({
      success: true,
      message: "Reembolso processado com sucesso e registado no histórico financeiro.",
      payment: result.paymentRecord,
      userReversed: result.userReversed
    });
  } catch (error: any) {
    console.error("[Admin Refund Route Error]:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/subscriptions/cancel
 * Cancel a subscription for a user (Prompt 3 & 6)
 */
router.post("/admin/subscriptions/cancel", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const { userId, cancelAtPeriodEnd, reason } = req.body;
    const cancelledBy = req.user.uid || req.user.email || "admin";

    if (!userId) {
      return res.status(400).json({ error: "userId é obrigatório." });
    }

    const result = await PaymentEngineService.cancelSubscription({
      userId,
      cancelAtPeriodEnd: cancelAtPeriodEnd !== false, // default true
      reason,
      cancelledBy
    });

    res.json({
      success: true,
      message: cancelAtPeriodEnd !== false 
        ? "Assinatura programada para cancelamento no fim do período corrente." 
        : "Assinatura cancelada imediatamente.",
      subscriptionStatus: result.subscriptionStatus
    });
  } catch (error: any) {
    console.error("[Admin Cancel Sub Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/subscriptions/reactivate
 * Reactivate an expired or cancelled subscription
 */
router.post("/admin/subscriptions/reactivate", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId é obrigatório." });
    }

    const result = await PaymentEngineService.reactivateSubscription(userId);

    res.json({
      success: true,
      message: "Assinatura reativada com sucesso.",
      result
    });
  } catch (error: any) {
    console.error("[Admin Reactivate Sub Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/subscriptions/change-plan
 * Upgrade/Downgrade user subscription with proration (Prompt 4 & 6)
 */
router.post("/admin/subscriptions/change-plan", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const { userId, newPlanId } = req.body;

    if (!userId || !newPlanId) {
      return res.status(400).json({ error: "userId e newPlanId são obrigatórios." });
    }

    const result = await PaymentEngineService.changePlan({
      userId,
      newPlanId,
      provider: "stripe"
    });

    res.json({
      success: true,
      message: `Plano alterado para ${newPlanId} com sucesso (${result.actionType.toUpperCase()}).`,
      prorationAmount: result.prorationAmount,
      newPlan: result.newPlan,
      user: result.updatedUser
    });
  } catch (error: any) {
    console.error("[Admin Change Plan Error]:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/payments/export
 * Export payment audit history as CSV (Prompt 6)
 */
router.get("/admin/payments/export", requireAuth, requireAdminOrFinance, async (req: any, res: any) => {
  try {
    const payments = await PaymentEngineService.getPayments({});

    const headers = ["ID Transacao", "ID Utilizador", "Provedor", "Plano", "Valor", "Moeda", "Estado", "Data Criacao", "Razao Reembolso", "Operador Reembolso"];
    const rows = payments.map(p => [
      `"${p.paymentId}"`,
      `"${p.userId}"`,
      `"${p.provider}"`,
      `"${p.planId}"`,
      p.amount,
      `"${p.currency.toUpperCase()}"`,
      `"${p.status}"`,
      `"${p.createdAt}"`,
      `"${p.refundReason || ''}"`,
      `"${p.refundOperator || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="relatorio_financeiro_lingolive_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("[Admin Export CSV Error]:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

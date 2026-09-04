import dotenv from "dotenv";
dotenv.config();

// Rede de segurança: erros assíncronos não tratados (ex: falhas de credenciais
// do Google Cloud disparadas em segundo plano pelo SDK do Firestore/gRPC) não
// devem derrubar o servidor inteiro. Registamos o erro e mantemos o processo vivo.
process.on("unhandledRejection", (reason: any) => {
  console.error("[unhandledRejection] Erro assíncrono não tratado (servidor continua ativo):", reason?.message || reason);
});
process.on("uncaughtException", (err: any) => {
  console.error("[uncaughtException] Erro não tratado (servidor continua ativo):", err?.message || err);
});

import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";

import { PORT, ENABLE_SANDBOX_FALLBACK } from "./server/config/env";
import { dbAdmin, authAdmin, verifyFirebaseConnection } from "./server/config/firebaseAdmin";
import { localMemoryDb, safeSetDoc, logSandboxWarning } from "./server/services/firestoreSafe.service";
import { setupWebSocket } from "./server/websocket/live.gateway";

// Import Routers
import healthRouter from "./server/routes/health.routes";
import aiRouter from "./server/routes/ai.routes";
import mamboRouter from "./server/routes/mambo.routes";
import paymentRouter from "./server/routes/payment.routes";
import paypalRouter from "./server/routes/paypal.routes";
import multicaixaRouter from "./server/routes/multicaixa.routes";
import schoolRouter from "./server/routes/school.routes";
import profileRouter from "./server/routes/profile.routes";
import adaptiveRouter from "./server/routes/adaptive.routes";
import pronunciationRouter from "./server/routes/pronunciation.routes";
import assessmentRouter from "./server/routes/assessment.routes";
import languagesRouter from "./server/routes/languages.routes";
import gamificationRouter from "./server/routes/gamification.routes";
import adminPaymentRouter from "./server/routes/adminPayment.routes";
import geoRouter from "./server/routes/geo.routes";
import learningAnalyticsRouter from "./server/routes/learningAnalytics.routes";
import certificationRouter from "./server/routes/certification.routes";
import ebookRouter from "./server/routes/ebook.routes";
import ebookExportRouter from "./server/routes/ebook.export.routes";
import ebookSalesRouter from "./server/routes/ebook.sales.routes";
import ebookStudentRouter from "./server/routes/ebook.student.routes";
import ebookAssistantRouter from "./server/routes/ebook.assistant.routes";
import ebookReviewRouter from "./server/routes/ebook.review.routes";
import ebookAnalyticsRouter from "./server/routes/ebook.analytics.routes";
import ebookRecommendationsRouter from "./server/routes/ebook.recommendations.routes";
import ebookNotificationsRouter from "./server/routes/ebook.notifications.routes";

const app = express();

// Stripe Webhook needs express.raw BEFORE express.json() is applied globally
// Mount paymentRouter containing Stripe webhook first
app.use("/api", paymentRouter);

// Global express.json() is applied only AFTER Stripe webhook route registration
app.use(express.json({ limit: '50mb' }));

// Mount remaining API routers
app.use("/api/service-health", healthRouter);
app.use("/api", aiRouter);
app.use("/api/mambo", mamboRouter);
app.use("/api/paypal", paypalRouter);
app.use("/api", multicaixaRouter);
app.use("/api", schoolRouter);
app.use("/api/profile", profileRouter);
app.use("/api/adaptive", adaptiveRouter);
app.use("/api/pronunciation", pronunciationRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api", languagesRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api", adminPaymentRouter);
app.use("/api/geo", geoRouter);
app.use("/api/analytics", learningAnalyticsRouter);
app.use("/api/certification", certificationRouter);
app.use("/api/ebook", ebookRouter);
app.use("/api/ebook/export", ebookExportRouter);
app.use("/api/ebook/sales", ebookSalesRouter);
app.use("/api/ebook/student", ebookStudentRouter);
app.use("/api/ebook/assistant", ebookAssistantRouter);
app.use("/api/ebook/reviews", ebookReviewRouter);
app.use("/api/ebook/analytics", ebookAnalyticsRouter);
app.use("/api/ebook/recommendations", ebookRecommendationsRouter);
app.use("/api/ebook/notifications", ebookNotificationsRouter);

// Endpoint for Service Worker Background Sync of vocabulary updates
app.post("/api/sync-vocabulary", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!authAdmin) {
    console.error("[API Sync] Authentication service unavailable.");
    return res.status(503).json({ error: "Service Unavailable" });
  }

  let verifiedUid: string;
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    verifiedUid = decodedToken.uid;
  } catch (authErr) {
    console.error("[API Sync] ID token verification failed.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, words } = req.body;
  
  // Validate payload structure
  if (!Array.isArray(words)) {
    return res.status(400).json({ error: "Invalid payload: words must be an array." });
  }

  // Prevent UID spoofing by comparing body userId with verified token UID
  if (userId && userId !== verifiedUid) {
    console.warn("[API Sync] User identity mismatch.");
    return res.status(403).json({ error: "Forbidden: Identity mismatch" });
  }

  try {
    console.log(`[API Sync] Processing vocabulary sync. Items: ${words.length}`);
    // Update user's savedWords list in user_achievements document using verifiedUid as authority
    await safeSetDoc("user_achievements", verifiedUid, { savedWords: words }, true);
    res.json({ success: true, message: "Vocabulary synced successfully." });
  } catch (error: any) {
    console.error("[API Sync] Vocabulary sync failed.");
    res.status(500).json({ error: "Failed to sync vocabulary." });
  }
});

// Create HTTP Server
const server = http.createServer(app);

// Setup WebSockets
setupWebSocket(server);

// Configure Vite or Static Asset serving
async function startServer() {
  // Explicitly await Firebase initialization
  await verifyFirebaseConnection();

  // Background Scheduler for Study Goal and Scheduled Lesson Reminders
  // Runs every 60 seconds to scan for reminders matching current local time
  let hasLoggedSchedulerError = false;
  setInterval(async () => {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!dbAdmin) return;
    
    let usersList: any[] = [];
    try {
      const usersSnapshot = await dbAdmin.collection("users").select("notificationSettings", "displayName", "name", "email").get();
      hasLoggedSchedulerError = false; // Reset error state on success
      usersSnapshot.forEach((doc: any) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
    } catch (err: any) {
      if (!hasLoggedSchedulerError) {
          logSandboxWarning("scheduler notification check", err);
          hasLoggedSchedulerError = true;
      }
      // Fallback: collect users from localMemoryDb
      for (const [key, value] of localMemoryDb.entries()) {
        if (key.startsWith("users_")) {
          const id = key.substring("users_".length);
          usersList.push({ id, ...value });
        }
      }
    }

    if (usersList.length === 0) return;
    
    usersList.forEach(async (userData: any) => {
      const settings = userData.notificationSettings;
      
      if (settings && settings.enabled) {
        // 1. Daily Study Goal Reminder
        if (settings.dailyReminderEnabled && settings.dailyReminderTime === currentHourMin) {
          const token = settings.fcmToken;
          const title = "LingoLive: Hora de Aprender! 🚀";
          const body = `Olá, ${userData.displayName || userData.name || 'Estudante'}! Está na hora de começar sua meta diária de estudo! Vamos conversar com o Kamba IA.`;
          
          console.log(`[Scheduler] Triggering study reminder for ${userData.email || userData.id} (Token: ${token})`);
          if (token && !token.startsWith("simulated_")) {
            try {
              const admin = (await import("firebase-admin")).default;
              await (admin as any).messaging().send({
                token: token,
                notification: { title, body },
                data: { type: "daily_reminder" }
              });
              console.log(`[Scheduler] Real FCM notification sent to ${userData.email}`);
            } catch (err: any) {
              console.warn(`[Scheduler] FCM notification failed for ${userData.email || userData.id}:`, err.message);
            }
          } else {
            console.log(`[Scheduler] Simulated daily reminder triggered for ${userData.email || userData.id}`);
          }
        }
      }
    });
  }, 60000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createServerVite();
    app.use(vite.middlewares);
  } else {
    // In production, static assets are in the 'dist' folder
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`[Server] Serving static files from: ${distPath}, NODE_ENV: ${process.env.NODE_ENV}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function createServerVite() {
  return await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
}

startServer();

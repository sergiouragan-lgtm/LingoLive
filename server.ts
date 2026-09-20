// CRITICAL: Load environment variables FIRST, before any other imports
import "./server/config/preload";
import path from "path";

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
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { PORT, ENABLE_SANDBOX_FALLBACK } from "./server/config/env";
import { dbAdmin, authAdmin, verifyFirebaseConnection } from "./server/config/firebaseAdmin";
import { localMemoryDb, safeSetDoc, logSandboxWarning } from "./server/services/firestoreSafe.service";
import { setupWebSocket } from "./server/websocket/live.gateway";
import { swaggerConfig, swaggerOptions } from "./server/config/swagger.config";

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
import ebookGamificationRouter from "./server/routes/ebook.gamification.routes";
import ebookAssignmentRouter from "./server/routes/ebook.assignment.routes";
import ebookVocabularyRouter from "./server/routes/ebook.vocabulary.routes";
// import livekitRouter from "./server/routes/livekit.routes"; // TODO: Fix TypeScript errors in livekit service
import openaiTutorRouter from "./server/routes/openai-tutor.routes";
import analyticsAdvancedRouter from "./server/routes/analytics-advanced.routes";

const app = express();

// Security Headers Middleware
// Protects against common web vulnerabilities
app.use((req, res, next) => {
  // Prevent MIME type sniffing - forces browser to respect Content-Type header
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking - page cannot be framed by other sites
  res.setHeader('X-Frame-Options', 'DENY');

  // Legacy XSS protection header (modern browsers use CSP)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Control which APIs/features can be used (geolocation, camera, microphone, etc.)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Enforce HTTPS in browsers that support it
  // Remove if running behind a reverse proxy that handles HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy - prevents XSS, clickjacking, and other injection attacks
  // Policy applies to all resources (scripts, styles, fonts, images, etc.)
  const csp = [
    // Default fallback for all resources
    "default-src 'self'",

    // Scripts: self + unsafe-inline for Tailwind/Vite injected styles, Firebase SDK
    "script-src 'self' 'unsafe-inline' https://*.firebaseapp.com https://cdn.jsdelivr.net",

    // Styles: self + unsafe-inline (Tailwind CSS injection), Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",

    // Fonts from Google Fonts and CDNs
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",

    // Images from self, data URIs (for base64 encoded images), and HTTPS sources
    "img-src 'self' data: https: blob:",

    // Media (video/audio) from self and HTTPS
    "media-src 'self' https: blob:",

    // API connections to Firebase, OpenAI, and local API
    "connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://firestore.googleapis.com https://storage.googleapis.com https://www.googleapis.com https://api.openai.com https://*.stripe.com wss://*",

    // Frames/iframes restricted
    "frame-src 'none'",

    // Embedded objects (Flash, etc.) blocked
    "object-src 'none'",

    // Form submissions only to same origin
    "form-action 'self'",

    // Can only be embedded by own origin
    "frame-ancestors 'none'",

    // Base URL must be same origin
    "base-uri 'self'",
  ].join('; ');

  // Use Content-Security-Policy (enforcing) header
  // Use report-only mode for testing: change to 'Content-Security-Policy-Report-Only'
  res.setHeader('Content-Security-Policy', csp);

  next();
});

// CORS Middleware - Control cross-origin access
// Prevents unauthorized cross-origin requests while allowing legitimate client access
const corsOrigins = [
  process.env.FRONTEND_URL || 'https://lingolive.com',
  'https://www.lingolive.com',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Alternative dev server
];

if (process.env.NODE_ENV !== 'production') {
  // Allow all localhost variants in development
  corsOrigins.push('http://127.0.0.1:5173', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (corsOrigins.some(allowed => allowed === origin || (process.env.NODE_ENV !== 'production' && origin.includes('localhost')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 3600, // 1 hour
}));

// Stripe Webhook needs express.raw BEFORE express.json() is applied globally
// Mount paymentRouter containing Stripe webhook first
app.use("/api/payment", paymentRouter);

// Global express.json() is applied only AFTER Stripe webhook route registration
app.use(express.json({ limit: '50mb' }));

// Rate Limiting Middleware - prevents brute force and DoS attacks
// General API rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path.startsWith('/api/service-health') ||
           req.path.startsWith('/.') ||
           req.path.endsWith('.js') ||
           req.path.endsWith('.css');
  }
});

// Strict limiter for authentication endpoints: 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // DO count failed requests (brute force protection)
});

// Apply general limiter to all /api routes
app.use('/api/', generalLimiter);

// Apply strict limiter to specific auth-related endpoints
// (Note: Specific auth routes should be protected further in their route handlers)

// Swagger/OpenAPI Documentation Setup
const swaggerSpec = swaggerJsdoc(swaggerConfig);
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerOptions));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
app.use("/api/ebook/gamification", ebookGamificationRouter);
app.use("/api/ebook/assignments", ebookAssignmentRouter);
app.use("/api/ebook/vocabulary", ebookVocabularyRouter);
// app.use("/api/livekit", livekitRouter); // TODO: Fix TypeScript errors in livekit service
app.use("/api/ai-tutor", openaiTutorRouter);
app.use("/api/analytics", analyticsAdvancedRouter);

/**
 * @swagger
 * /sync-vocabulary:
 *   post:
 *     summary: Sync vocabulary words for a user
 *     description: |
 *       Synchronizes vocabulary words via Service Worker background sync.
 *       Used for offline-first vocabulary management.
 *     tags:
 *       - Vocabulary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - words
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional user ID (verified from token)
 *               words:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 1000
 *                 items:
 *                   $ref: '#/components/schemas/VocabWord'
 *     responses:
 *       200:
 *         description: Vocabulary synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (identity mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

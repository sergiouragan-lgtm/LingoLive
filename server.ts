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
import { Server as SocketIOServer } from "socket.io";

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
import queueRouter from "./server/routes/queue.routes";
import searchRouter from "./server/routes/search.routes";
import notificationsRouter from "./server/routes/notifications.routes";
import userPreferencesRouter from "./server/routes/userPreferences.routes";
import emailRouter from "./server/routes/email.routes";
import twoFARouter from "./server/routes/twofa.routes";
import paymentTiersRouter from "./server/routes/payment.routes";
import fcmRouter from "./server/routes/fcm.routes";
import analyticsDashboardRouter from "./server/routes/analytics.routes";
import rateLimitRouter from "./server/routes/ratelimit.routes";
import cacheRouter from "./server/routes/cache.routes";
import webhooksRouter from "./server/routes/webhooks.routes";
import featureFlagsRouter from "./server/routes/featureflags.routes";
import dataExportRouter from "./server/routes/dataexport.routes";
import analyticsRouter from "./server/routes/analytics.routes";
import engagementRouter from "./server/routes/engagement.routes";
import learningAnalyticsRouter2 from "./server/routes/learning-analytics.routes";
import insightsRouter from "./server/routes/insights.routes";
import predictiveAnalyticsRouter from "./server/routes/predictive-analytics.routes";
import { queueManager, JobType } from "./server/services/queue.service";
import { processEmailJob } from "./server/services/jobProcessors/emailProcessor";
import { processReportJob } from "./server/services/jobProcessors/reportProcessor";
import { processExportJob } from "./server/services/jobProcessors/exportProcessor";
import { processBatchNotificationJob } from "./server/services/jobProcessors/notificationProcessor";
import { notificationsService } from "./server/services/notifications.service";
import { notificationsGateway } from "./server/websocket/notifications.gateway";
import { userPreferencesService } from "./server/services/userPreferences.service";
import { emailService } from "./server/services/email.service";
import { twoFAService } from "./server/services/twofa.service";
import { paymentService } from "./server/services/payment.service";
import { fcmService } from "./server/services/fcm.service";
import { analyticsDashboardService } from "./server/services/analytics.dashboard.service";
import { rateLimitService } from "./server/services/ratelimit.service";
import { cacheService } from "./server/services/cache.service";
import { webhooksService } from "./server/services/webhooks.service";
import { featureFlagsService } from "./server/services/featureflags.service";
import { dataExportService } from "./server/services/dataexport.service";
import { analyticsService } from "./server/services/analytics.service";
import { engagementService } from "./server/services/engagement.service";
import { learningAnalyticsService } from "./server/services/learning-analytics.service";
import { insightsService } from "./server/services/insights.service";
import { predictiveAnalyticsService } from "./server/services/predictive-analytics.service";
import adminRouter from "./server/routes/admin.routes";
import reportingRouter from "./server/routes/reporting.routes";
import complianceRouter from "./server/routes/compliance.routes";
import systemHealthRouter from "./server/routes/system-health.routes";
import financialAnalyticsRouter from "./server/routes/financial-analytics.routes";
import { adminService } from "./server/services/admin.service";
import { reportingService } from "./server/services/reporting.service";
import { complianceService } from "./server/services/compliance.service";
import { systemHealthService } from "./server/services/system-health.service";
import { financialAnalyticsService } from "./server/services/financial-analytics.service";
import anomalyDetectionRouter from "./server/routes/anomaly-detection.routes";
import mlModelsRouter from "./server/routes/ml-models.routes";
import realtimeDashboardRouter from "./server/routes/realtime-dashboard.routes";
import biIntegrationRouter from "./server/routes/bi-integration.routes";
import recommendationsRouter from "./server/routes/recommendations.routes";
import { anomalyDetectionService } from "./server/services/anomaly-detection.service";
import { mlModelsService } from "./server/services/ml-models.service";
import { realtimeDashboardService } from "./server/services/realtime-dashboard.service";
import { biIntegrationService } from "./server/services/bi-integration.service";
import { recommendationsService } from "./server/services/recommendations.service";
import deepLearningRouter from "./server/routes/deep-learning.routes";
import modelServingRouter from "./server/routes/model-serving.routes";
import anomalyInterpretabilityRouter from "./server/routes/anomaly-interpretability.routes";
import advancedBIIntegrationRouter from "./server/routes/advanced-bi-integrations.routes";
import federatedLearningRouter from "./server/routes/federated-learning.routes";
import { deepLearningService } from "./server/services/deep-learning.service";
import { modelServingService } from "./server/services/model-serving.service";
import { anomalyInterpretabilityService } from "./server/services/anomaly-interpretability.service";
import { advancedBIIntegrationService } from "./server/services/advanced-bi-integrations.service";
import { federatedLearningService } from "./server/services/federated-learning.service";
import learningPathOptimizationRouter from "./server/routes/learning-path-optimization.routes";
import personalizedRecommendationsRouter from "./server/routes/personalized-recommendations.routes";
import realtimeLearningAnalyticsRouter from "./server/routes/realtime-learning-analytics.routes";
import adaptiveAssessmentRouter from "./server/routes/adaptive-assessment.routes";
import intelligentTutoringRouter from "./server/routes/intelligent-tutoring.routes";
import { learningPathOptimizationService } from "./server/services/learning-path-optimization.service";
import { personalizedRecommendationsService } from "./server/services/personalized-recommendations.service";
import { realTimeLearningAnalyticsService } from "./server/services/realtime-learning-analytics.service";
import { adaptiveAssessmentService } from "./server/services/adaptive-assessment.service";
import { intelligentTutoringService } from "./server/services/intelligent-tutoring.service";
import gamificationEngagementRouter from "./server/routes/gamification-engagement.routes";
import socialLearningRouter from "./server/routes/social-learning.routes";
import contentCurationGenerationRouter from "./server/routes/content-curation-generation.routes";
import analyticsDashboardRouter26 from "./server/routes/analytics-dashboard.routes";
import mobileOfflineSyncRouter from "./server/routes/mobile-offline-sync.routes";
import { gamificationEngagementService } from "./server/services/gamification-engagement.service";
import { socialLearningService } from "./server/services/social-learning.service";
import { contentCurationGenerationService } from "./server/services/content-curation-generation.service";
import { analyticsDashboardService as analyticsDashboardService26 } from "./server/services/analytics-dashboard.service";
import { mobileOfflineSyncService } from "./server/services/mobile-offline-sync.service";
import adaptiveLearningPathsRouter from "./server/routes/adaptive-learning-paths.routes";
import aiTutorResponseRouter from "./server/routes/ai-tutor-response.routes";
import personalizationEngineRouter from "./server/routes/personalization-engine.routes";
import learningStyleAdaptationRouter from "./server/routes/learning-style-adaptation.routes";
import predictiveInterventionRouter from "./server/routes/predictive-intervention.routes";
import { adaptiveLearningPathsService } from "./server/services/adaptive-learning-paths.service";
import { aiTutorResponseService } from "./server/services/ai-tutor-response.service";
import { personalizationEngineService } from "./server/services/personalization-engine.service";
import { learningStyleAdaptationService } from "./server/services/learning-style-adaptation.service";
import { predictiveInterventionService } from "./server/services/predictive-intervention.service";
import realTimeFormativeAssessmentRouter from "./server/routes/real-time-formative-assessment.routes";
import masteryCompetencyTrackingRouter from "./server/routes/mastery-competency-tracking.routes";
import learningOutcomeMeasurementRouter from "./server/routes/learning-outcome-measurement.routes";
import progressDashboardReportingRouter from "./server/routes/progress-dashboard-reporting.routes";
import assessmentAnalyticsRouter from "./server/routes/assessment-analytics.routes";
import { realTimeFormativeAssessmentService } from "./server/services/real-time-formative-assessment.service";
import { masteryCompetencyTrackingService } from "./server/services/mastery-competency-tracking.service";
import { learningOutcomeMeasurementService } from "./server/services/learning-outcome-measurement.service";
import { progressDashboardReportingService } from "./server/services/progress-dashboard-reporting.service";
import { assessmentAnalyticsService } from "./server/services/assessment-analytics.service";
import badgeAchievementRecognitionRouter from "./server/routes/badge-achievement-recognition.routes";
import certificateCompletionVerificationRouter from "./server/routes/certificate-completion-verification.routes";
import skillCredentialsCompetencyBadgesRouter from "./server/routes/skill-credentials-competency-badges.routes";
import portfolioBuildingShowcaseRouter from "./server/routes/portfolio-building-showcase.routes";
import transcriptManagementVerificationRouter from "./server/routes/transcript-management-verification.routes";
import { badgeAchievementRecognitionService } from "./server/services/badge-achievement-recognition.service";
import { certificateCompletionVerificationService } from "./server/services/certificate-completion-verification.service";
import { skillCredentialsCompetencyBadgesService } from "./server/services/skill-credentials-competency-badges.service";
import { portfolioBuildingShowcaseService } from "./server/services/portfolio-building-showcase.service";
import { transcriptManagementVerificationService } from "./server/services/transcript-management-verification.service";
import realtimeLearnerAnalyticsRouter from "./server/routes/realtime-learner-analytics.routes";
import cohortAnalysisBenchmarkingRouter from "./server/routes/cohort-analysis-benchmarking.routes";
import customReportBuilderRouter from "./server/routes/custom-report-builder.routes";
import { realtimeLearnerAnalyticsService } from "./server/services/realtime-learner-analytics.service";
import { cohortAnalysisBenchmarkingService } from "./server/services/cohort-analysis-benchmarking.service";
import { customReportBuilderService } from "./server/services/custom-report-builder.service";
import offlineFirstArchitectureRouter from "./server/routes/offline-first-architecture.routes";
import advancedServiceWorkerRouter from "./server/routes/advanced-service-worker.routes";
import offlineDataSyncRouter from "./server/routes/offline-data-sync.routes";
import mobilePerformanceOptimizationRouter from "./server/routes/mobile-performance-optimization.routes";
import offlineFirstAnalyticsReportingRouter from "./server/routes/offline-first-analytics-reporting.routes";
import { offlineFirstArchitectureService } from "./server/services/offline-first-architecture.service";
import { advancedServiceWorkerService } from "./server/services/advanced-service-worker.service";
import { offlineDataSyncService } from "./server/services/offline-data-sync.service";
import { mobilePerformanceOptimizationService } from "./server/services/mobile-performance-optimization.service";
import { offlineFirstAnalyticsReportingService } from "./server/services/offline-first-analytics-reporting.service";
import unitTestingFrameworkRouter from "./server/routes/unit-testing-framework.routes";
import integrationTestingRouter from "./server/routes/integration-testing.routes";
import e2eTestingRouter from "./server/routes/e2e-testing.routes";
import performanceTestingRouter from "./server/routes/performance-testing.routes";
import testCoverageQualityRouter from "./server/routes/test-coverage-quality.routes";
import continuousTestingPipelineRouter from "./server/routes/continuous-testing-pipeline.routes";
import testDocumentationBestPracticesRouter from "./server/routes/test-documentation-best-practices.routes";
import { unitTestingFrameworkService } from "./server/services/unit-testing-framework.service";
import { integrationTestingService } from "./server/services/integration-testing.service";
import { e2eTestingService } from "./server/services/e2e-testing.service";
import { performanceTestingService } from "./server/services/performance-testing.service";
import { testCoverageQualityService } from "./server/services/test-coverage-quality.service";
import { continuousTestingPipelineService } from "./server/services/continuous-testing-pipeline.service";
import { testDocumentationBestPracticesService } from "./server/services/test-documentation-best-practices.service";
import applicationPerformanceMonitoringRouter from "./server/routes/application-performance-monitoring.routes";
import loggingAggregationRouter from "./server/routes/logging-aggregation.routes";
import metricsTimeseriesRouter from "./server/routes/metrics-timeseries.routes";
import distributedTracingRouter from "./server/routes/distributed-tracing.routes";
import alertingNotificationsRouter from "./server/routes/alerting-notifications.routes";
import healthChecksUptimeRouter from "./server/routes/health-checks-uptime.routes";
import performanceOptimizationRouter from "./server/routes/performance-optimization.routes";
import { applicationPerformanceMonitoringService } from "./server/services/application-performance-monitoring.service";
import { loggingAggregationService } from "./server/services/logging-aggregation.service";
import { metricsTimeseriesService } from "./server/services/metrics-timeseries.service";
import { distributedTracingService } from "./server/services/distributed-tracing.service";
import { alertingNotificationsService } from "./server/services/alerting-notifications.service";
import { healthChecksUptimeService } from "./server/services/health-checks-uptime.service";
import { performanceOptimizationService } from "./server/services/performance-optimization.service";

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
app.use("/api/queue", queueRouter);
app.use("/api/search", searchRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/user-preferences", userPreferencesRouter);
app.use("/api/email", emailRouter);
app.use("/api/2fa", twoFARouter);
app.use("/api/subscriptions", paymentTiersRouter);
app.use("/api/fcm", fcmRouter);
app.use("/api/analytics/dashboard", analyticsDashboardRouter);
app.use("/api/rate-limit", rateLimitRouter);
app.use("/api/cache", cacheRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/feature-flags", featureFlagsRouter);
app.use("/api/data-export", dataExportRouter);
app.use("/api/analytics/events", analyticsRouter);
app.use("/api/engagement", engagementRouter);
app.use("/api/learning-analytics", learningAnalyticsRouter2);
app.use("/api/insights", insightsRouter);
app.use("/api/predictive-analytics", predictiveAnalyticsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reporting", reportingRouter);
app.use("/api/compliance", complianceRouter);
app.use("/api/system-health", systemHealthRouter);
app.use("/api/financial-analytics", financialAnalyticsRouter);
app.use("/api/anomaly-detection", anomalyDetectionRouter);
app.use("/api/ml-models", mlModelsRouter);
app.use("/api/realtime-dashboard", realtimeDashboardRouter);
app.use("/api/bi-integration", biIntegrationRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/deep-learning", deepLearningRouter);
app.use("/api/model-serving", modelServingRouter);
app.use("/api/anomaly-interpretability", anomalyInterpretabilityRouter);
app.use("/api/advanced-bi-integrations", advancedBIIntegrationRouter);
app.use("/api/federated-learning", federatedLearningRouter);
app.use("/api/learning-paths", learningPathOptimizationRouter);
app.use("/api/recommendations", personalizedRecommendationsRouter);
app.use("/api/learning-analytics", realtimeLearningAnalyticsRouter);
app.use("/api/assessments", adaptiveAssessmentRouter);
app.use("/api/tutoring", intelligentTutoringRouter);
app.use("/api/gamification", gamificationEngagementRouter);
app.use("/api/social", socialLearningRouter);
app.use("/api/content", contentCurationGenerationRouter);
app.use("/api/analytics/insights", analyticsDashboardRouter26);
app.use("/api/mobile", mobileOfflineSyncRouter);
app.use("/api/learning-paths", adaptiveLearningPathsRouter);
app.use("/api/tutor", aiTutorResponseRouter);
app.use("/api/personalization", personalizationEngineRouter);
app.use("/api/learning-style", learningStyleAdaptationRouter);
app.use("/api/interventions", predictiveInterventionRouter);
app.use("/api/assessment/formative", realTimeFormativeAssessmentRouter);
app.use("/api/assessment/mastery", masteryCompetencyTrackingRouter);
app.use("/api/assessment/outcomes", learningOutcomeMeasurementRouter);
app.use("/api/assessment/progress", progressDashboardReportingRouter);
app.use("/api/assessment/analytics", assessmentAnalyticsRouter);
app.use("/api/certification/badges", badgeAchievementRecognitionRouter);
app.use("/api/certification/certificates", certificateCompletionVerificationRouter);
app.use("/api/certification/skills", skillCredentialsCompetencyBadgesRouter);
app.use("/api/certification/portfolio", portfolioBuildingShowcaseRouter);
app.use("/api/certification/transcripts", transcriptManagementVerificationRouter);
app.use("/api/analytics/realtime-learner", realtimeLearnerAnalyticsRouter);
app.use("/api/analytics/cohorts", cohortAnalysisBenchmarkingRouter);
app.use("/api/analytics/reports", customReportBuilderRouter);
app.use("/api/offline/architecture", offlineFirstArchitectureRouter);
app.use("/api/offline/service-worker", advancedServiceWorkerRouter);
app.use("/api/offline/sync", offlineDataSyncRouter);
app.use("/api/mobile/performance", mobilePerformanceOptimizationRouter);
app.use("/api/offline/analytics", offlineFirstAnalyticsReportingRouter);
app.use("/api/testing/unit", unitTestingFrameworkRouter);
app.use("/api/testing/integration", integrationTestingRouter);
app.use("/api/testing/e2e", e2eTestingRouter);
app.use("/api/testing/performance", performanceTestingRouter);
app.use("/api/testing/coverage", testCoverageQualityRouter);
app.use("/api/testing/pipeline", continuousTestingPipelineRouter);
app.use("/api/testing/documentation", testDocumentationBestPracticesRouter);
app.use("/api/monitoring/apm", applicationPerformanceMonitoringRouter);
app.use("/api/monitoring/logging", loggingAggregationRouter);
app.use("/api/monitoring/metrics", metricsTimeseriesRouter);
app.use("/api/monitoring/tracing", distributedTracingRouter);
app.use("/api/monitoring/alerting", alertingNotificationsRouter);
app.use("/api/monitoring/health", healthChecksUptimeRouter);
app.use("/api/monitoring/optimization", performanceOptimizationRouter);

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

// Setup WebSockets for Live Classes
setupWebSocket(server);

// Initialize Socket.IO for Real-Time Notifications
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://lingolive.app', 'https://www.lingolive.app']
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
  maxHttpBufferSize: 1e6, // 1MB
  pingInterval: 30000,
  pingTimeout: 10000,
});

// Configure Vite or Static Asset serving
async function startServer() {
  // Explicitly await Firebase initialization
  await verifyFirebaseConnection();

  // Initialize Notifications Gateway
  console.log('[Server] Initializing real-time notifications gateway...');
  notificationsGateway.initialize(io);
  console.log('[Server] Notifications gateway initialized successfully');

  // Initialize Job Queue Processors
  console.log('[Server] Initializing background job processors...');
  queueManager.registerProcessor(JobType.SEND_EMAIL, processEmailJob, 5);
  queueManager.registerProcessor(JobType.GENERATE_REPORT, processReportJob, 2);
  queueManager.registerProcessor(JobType.EXPORT_DATA, processExportJob, 2);
  queueManager.registerProcessor(JobType.BATCH_NOTIFICATION, processBatchNotificationJob, 3);
  console.log('[Server] Job processors registered successfully');

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

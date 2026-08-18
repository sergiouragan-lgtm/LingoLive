import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFirebaseApp } from '../config/firebase.config';

export type EnterpriseEventName =
  | 'login_attempt'
  | 'registration_completed'
  | 'lesson_started'
  | 'lesson_finished'
  | 'tutor_session_initiated'
  | 'assessment_started'
  | 'assessment_finished'
  | 'marketplace_purchase_success'
  | 'stripe_subscription_changed'
  | 'certificate_issued'
  | 'achievement_unlocked'
  | 'avatar_customization_changed'
  | 'league_rank_progressed'
  | 'school_metric_aggregated'
  | 'corporate_kpi_recorded';

export class AnalyticsService {
  private analytics: Analytics | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.analytics = getAnalytics(getFirebaseApp());
        console.log("[Enterprise Analytics] Web SDK connected successfully.");
      } catch (e) {
        console.warn("[Enterprise Analytics] Local browser cookies blocked or failed to load external analytics scripts.", e);
      }
    }
  }

  /**
   * Dispatches customized telemetry events securely.
   */
  public logEnterpriseEvent(
    eventName: EnterpriseEventName,
    parameters: Record<string, any> = {}
  ): void {
    const enrichedParams = {
      ...parameters,
      developerContext: "Sergio.uragan@gmail.com",
      platformEnvironment: "Enterprise-Web",
      timestamp: new Date().toISOString()
    };

    console.log(`[Enterprise Telemetry Stream] Logging Event: ${eventName} | Params:`, JSON.stringify(enrichedParams));

    if (this.analytics) {
      try {
        logEvent(this.analytics, eventName, enrichedParams);
      } catch (err) {
        console.error(`[Enterprise Analytics Error] Logging failed for ${eventName}`, err);
      }
    }
  }

  /**
   * Tracks user interaction for school accounts
   */
  public trackSchoolActivity(schoolId: string, action: string, studentCount: number): void {
    this.logEnterpriseEvent('school_metric_aggregated', {
      schoolId,
      action,
      studentCount,
      metricType: 'ENGAGEMENT_DAILY'
    });
  }

  /**
   * Tracks user interaction for corporate manager reviews
   */
  public trackCorporateKpi(companyId: string, employeeUid: string, courseProgress: number): void {
    this.logEnterpriseEvent('corporate_kpi_recorded', {
      companyId,
      employeeUid,
      courseProgress,
      completionTargetReached: courseProgress >= 100
    });
  }
}

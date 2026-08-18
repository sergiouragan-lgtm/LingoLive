import { BaseRepository } from './BaseRepository';
import { 
  EnterpriseUser, 
  EnterpriseProfile, 
  EnterpriseSchool, 
  EnterpriseTeacher, 
  EnterpriseStudent, 
  EnterpriseCompany, 
  EnterpriseSubscription, 
  EnterprisePayment, 
  EnterpriseCourse, 
  EnterpriseLesson, 
  EnterpriseAssessment, 
  EnterpriseQuestion, 
  EnterpriseCertificate, 
  EnterpriseMarketplaceItem, 
  EnterpriseAvatar, 
  EnterpriseGamificationProfile, 
  EnterpriseNotification, 
  EnterpriseAmbassador, 
  EnterpriseAuditLog, 
  EnterpriseAISession, 
  EnterpriseAIMemory, 
  EnterpriseLanguageProfile, 
  EnterpriseDialect, 
  EnterpriseCountry, 
  EnterpriseTranslation, 
  EnterpriseFeatureFlag, 
  EnterpriseAnalyticsEvent, 
  EnterpriseSystemLog 
} from '../types';
import { query, collection, where, getDocs, limit, orderBy, addDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../../config/firebase.config';

// 1. Users Repository
export class UserRepository extends BaseRepository<EnterpriseUser> {
  constructor() { super('users'); }
  
  public async getByEmail(email: string, tenantId: string): Promise<EnterpriseUser | null> {
    try {
      const q = query(collection(this.db, 'users'), where('email', '==', email), where('tenantId', '==', tenantId), where('softDelete', '==', false), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EnterpriseUser;
    } catch (e) {
      this.handleFirestoreError(e, 4 as any, 'users/query/email');
    }
  }
}

// 2. Profiles Repository
export class ProfileRepository extends BaseRepository<EnterpriseProfile> {
  constructor() { super('profiles'); }
}

// 3. Schools Repository
export class SchoolRepository extends BaseRepository<EnterpriseSchool> {
  constructor() { super('schools'); }
}

// 4. Teachers Repository
export class TeacherRepository extends BaseRepository<EnterpriseTeacher> {
  constructor() { super('teachers'); }
}

// 5. Students Repository
export class StudentRepository extends BaseRepository<EnterpriseStudent> {
  constructor() { super('students'); }
}

// 6. Companies Repository
export class CompanyRepository extends BaseRepository<EnterpriseCompany> {
  constructor() { super('companies'); }
}

// 7. Subscriptions Repository
export class SubscriptionRepository extends BaseRepository<EnterpriseSubscription> {
  constructor() { super('subscriptions'); }
}

// 8. Payments Repository
export class PaymentRepository extends BaseRepository<EnterprisePayment> {
  constructor() { super('payments'); }
}

// 9. Courses Repository
export class CourseRepository extends BaseRepository<EnterpriseCourse> {
  constructor() { super('courses'); }
}

// 10. Lessons Repository
export class LessonRepository extends BaseRepository<EnterpriseLesson> {
  constructor() { super('lessons'); }
}

// 11. Assessments Repository
export class AssessmentRepository extends BaseRepository<EnterpriseAssessment> {
  constructor() { super('assessments'); }
}

// 12. QuestionBank Repository
export class QuestionBankRepository extends BaseRepository<EnterpriseQuestion> {
  constructor() { super('questionBank'); }
}

// 13. Certificates Repository
export class CertificateRepository extends BaseRepository<EnterpriseCertificate> {
  constructor() { super('certificates'); }
}

// 14. Marketplace Repository
export class MarketplaceRepository extends BaseRepository<EnterpriseMarketplaceItem> {
  constructor() { super('marketplace'); }
}

// 15. Avatars Repository
export class AvatarRepository extends BaseRepository<EnterpriseAvatar> {
  constructor() { super('avatars'); }
}

// 16. Gamification Repository
export class GamificationRepository extends BaseRepository<EnterpriseGamificationProfile> {
  constructor() { super('gamification'); }
}

// 17. Notifications Repository
export class NotificationRepository extends BaseRepository<EnterpriseNotification> {
  constructor() { super('notifications'); }
}

// 18. Ambassadors Repository
export class AmbassadorRepository extends BaseRepository<EnterpriseAmbassador> {
  constructor() { super('ambassadors'); }
}

// 19. AuditLogs Repository
export class AuditLogRepository {
  private db = getFirebaseFirestore();
  
  public async logSensitiveAction(log: Omit<EnterpriseAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const colRef = collection(this.db, 'auditLogs');
      await addDoc(colRef, {
        ...log,
        timestamp: new Date().toISOString()
      });
      console.log(`[Enterprise Global Audit] Registered action: ${log.action} under tenant: ${log.tenantId}`);
    } catch (e) {
      console.error("[Enterprise Global Audit] Failed to record audit session trail.", e);
    }
  }
}

// 20. AISessions Repository
export class AISessionRepository extends BaseRepository<EnterpriseAISession> {
  constructor() { super('aiSessions'); }
}

// 21. AIMemory Repository
export class AIMemoryRepository extends BaseRepository<EnterpriseAIMemory> {
  constructor() { super('aiMemory'); }
}

// 22. LanguageProfiles Repository
export class LanguageProfileRepository extends BaseRepository<EnterpriseLanguageProfile> {
  constructor() { super('languageProfiles'); }
}

// 23. Dialects Repository
export class DialectRepository extends BaseRepository<EnterpriseDialect> {
  constructor() { super('dialects'); }
}

// 24. Countries Repository
export class CountryRepository extends BaseRepository<EnterpriseCountry> {
  constructor() { super('countries'); }
}

// 25. Translations Repository
export class TranslationRepository extends BaseRepository<EnterpriseTranslation> {
  constructor() { super('translations'); }
}

// 26. FeatureFlags Repository
export class FeatureFlagRepository extends BaseRepository<EnterpriseFeatureFlag> {
  constructor() { super('featureFlags'); }
}

// 27. AnalyticsEvents Repository
export class AnalyticsEventRepository {
  private db = getFirebaseFirestore();

  public async logEvent(event: Omit<EnterpriseAnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const colRef = collection(this.db, 'analyticsEvents');
      await addDoc(colRef, {
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("[Enterprise Analytics] Failed to log telemetry.", e);
    }
  }
}

// 28. SystemLogs Repository
export class SystemLogRepository {
  private db = getFirebaseFirestore();

  public async logSystemMessage(log: Omit<EnterpriseSystemLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const colRef = collection(this.db, 'systemLogs');
      await addDoc(colRef, {
        ...log,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("[Enterprise System Kernel] Logging service issue.", e);
    }
  }
}

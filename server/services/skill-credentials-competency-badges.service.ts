import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface SkillCredential {
  credentialId: string;
  skillId: string;
  skillName: string;
  skillCategory: 'language' | 'technical' | 'soft-skill' | 'domain-expertise';
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verificationMethod: 'assessment' | 'project' | 'certification' | 'peer-review';
  proficiencyScore: number;
  endorsements: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface CompetencyBadge {
  badgeId: string;
  badgeName: string;
  competencyId: string;
  competencyName: string;
  competencyType: 'core' | 'supplementary' | 'advanced' | 'specialization';
  badgeImageUrl: string;
  criteria: BadgeCriteria[];
  difficultyLevel: 'novice' | 'intermediate' | 'proficient' | 'expert';
  prerequisites: string[];
  pointValue: number;
  createdAt: Date;
}

export interface BadgeCriteria {
  criterionId: string;
  description: string;
  threshold: number;
  measurable: boolean;
}

export interface UserCompetencyProfile {
  profileId: string;
  userId: string;
  userName: string;
  credentials: SkillCredential[];
  badgeCompletions: CompetencyBadgeCompletion[];
  competencyAreas: CompetencyArea[];
  overallProficiency: number;
  certificationReadiness: CertificationReadiness[];
  lastUpdated: Date;
}

export interface CompetencyBadgeCompletion {
  completionId: string;
  badgeId: string;
  userId: string;
  completedAt: Date;
  evidenceDocuments: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface CompetencyArea {
  areaId: string;
  areaName: string;
  proficiencyPercentage: number;
  skillsAcquired: string[];
  masteryCertificates: string[];
  recommendedNextSkills: string[];
}

export interface CertificationReadiness {
  certificationId: string;
  certificationName: string;
  readinessScore: number;
  missingCompetencies: string[];
  estimatedReadinessDate: Date;
}

class SkillCredentialsCompetencyBadgesService {
  private db = getFirestore();

  async createSkillCredential(
    skillId: string,
    skillName: string,
    skillCategory: 'language' | 'technical' | 'soft-skill' | 'domain-expertise',
    description: string,
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    verificationMethod: 'assessment' | 'project' | 'certification' | 'peer-review'
  ): Promise<SkillCredential> {
    try {
      const credentialId = `skill_cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const credential: SkillCredential = {
        credentialId,
        skillId,
        skillName,
        skillCategory,
        description,
        level,
        verificationMethod,
        proficiencyScore: 0,
        endorsements: 0,
        isVerified: false,
        createdAt: new Date(),
      };

      await this.db.collection('skill_credentials').doc(credentialId).set(credential);

      logSecurityEvent('SKILL_CREDENTIAL_CREATED' as any, 'info' as any, 'Skill credential created', {
        credentialId,
        skillName,
        skillCategory,
      });

      return credential;
    } catch (error) {
      logSecurityEvent('SKILL_CREDENTIAL_CREATION_FAILED' as any, 'error' as any, 'Failed to create skill credential', {
        skillName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createCompetencyBadge(
    badgeName: string,
    competencyId: string,
    competencyName: string,
    competencyType: 'core' | 'supplementary' | 'advanced' | 'specialization',
    badgeImageUrl: string,
    criteria: BadgeCriteria[],
    difficultyLevel: 'novice' | 'intermediate' | 'proficient' | 'expert',
    prerequisites: string[],
    pointValue: number
  ): Promise<CompetencyBadge> {
    try {
      const badgeId = `comp_badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const badge: CompetencyBadge = {
        badgeId,
        badgeName,
        competencyId,
        competencyName,
        competencyType,
        badgeImageUrl,
        criteria,
        difficultyLevel,
        prerequisites,
        pointValue,
        createdAt: new Date(),
      };

      await this.db.collection('competency_badges').doc(badgeId).set(badge);

      logSecurityEvent('COMPETENCY_BADGE_CREATED' as any, 'info' as any, 'Competency badge created', {
        badgeId,
        badgeName,
        competencyId,
      });

      return badge;
    } catch (error) {
      logSecurityEvent('COMPETENCY_BADGE_CREATION_FAILED' as any, 'error' as any, 'Failed to create competency badge', {
        badgeName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async buildUserCompetencyProfile(userId: string): Promise<UserCompetencyProfile> {
    try {
      const profileId = `comp_profile_${userId}_${Date.now()}`;

      const credentialsQuery = await this.db
        .collection('skill_credentials')
        .where('userId', '==', userId)
        .get();

      const credentials = credentialsQuery.docs.map((doc) => doc.data() as SkillCredential);

      const badgeQuery = await this.db
        .collection('competency_badge_completions')
        .where('userId', '==', userId)
        .get();

      const badgeCompletions = badgeQuery.docs.map((doc) => doc.data() as CompetencyBadgeCompletion);

      const competencyAreas = this.buildCompetencyAreas(credentials);
      const overallProficiency = this.calculateOverallProficiency(credentials);
      const certificationReadiness = await this.assessCertificationReadiness(userId, credentials);

      const profile: UserCompetencyProfile = {
        profileId,
        userId,
        userName: '', // To be populated from user data
        credentials,
        badgeCompletions,
        competencyAreas,
        overallProficiency,
        certificationReadiness,
        lastUpdated: new Date(),
      };

      await this.db.collection('user_competency_profiles').doc(profileId).set(profile);

      logSecurityEvent('COMPETENCY_PROFILE_BUILT' as any, 'info' as any, 'User competency profile built', {
        userId,
        overallProficiency,
      });

      return profile;
    } catch (error) {
      logSecurityEvent('COMPETENCY_PROFILE_BUILD_FAILED' as any, 'error' as any, 'Failed to build competency profile', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async awardCompetencyBadge(userId: string, badgeId: string, evidenceDocuments: string[]): Promise<CompetencyBadgeCompletion> {
    try {
      const completionId = `badge_completion_${userId}_${badgeId}_${Date.now()}`;

      const completion: CompetencyBadgeCompletion = {
        completionId,
        badgeId,
        userId,
        completedAt: new Date(),
        evidenceDocuments,
        verificationStatus: 'pending',
      };

      await this.db.collection('competency_badge_completions').doc(completionId).set(completion);

      logSecurityEvent('COMPETENCY_BADGE_AWARDED' as any, 'info' as any, 'Competency badge awarded to user', {
        userId,
        badgeId,
        completionId,
      });

      return completion;
    } catch (error) {
      logSecurityEvent('COMPETENCY_BADGE_AWARD_FAILED' as any, 'error' as any, 'Failed to award competency badge', {
        userId,
        badgeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async verifySkillCompetency(credentialId: string, proficiencyScore: number): Promise<SkillCredential> {
    try {
      const credDoc = await this.db.collection('skill_credentials').doc(credentialId).get();
      const credential = credDoc.data() as SkillCredential;

      if (!credential) throw new Error('Skill credential not found');

      credential.proficiencyScore = proficiencyScore;
      credential.isVerified = proficiencyScore >= 70;

      await this.db.collection('skill_credentials').doc(credentialId).update({
        proficiencyScore,
        isVerified: credential.isVerified,
      });

      logSecurityEvent('SKILL_COMPETENCY_VERIFIED' as any, 'info' as any, 'Skill competency verified', {
        credentialId,
        proficiencyScore,
        isVerified: credential.isVerified,
      });

      return credential;
    } catch (error) {
      logSecurityEvent('SKILL_COMPETENCY_VERIFICATION_FAILED' as any, 'error' as any, 'Failed to verify skill competency', {
        credentialId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async endorseSkillCredential(credentialId: string, endorserId: string): Promise<SkillCredential> {
    try {
      const credDoc = await this.db.collection('skill_credentials').doc(credentialId).get();
      const credential = credDoc.data() as SkillCredential;

      if (!credential) throw new Error('Skill credential not found');

      const endorsements = (credential.endorsements || 0) + 1;

      await this.db.collection('skill_credentials').doc(credentialId).update({
        endorsements,
      });

      await this.db.collection('skill_endorsements').add({
        credentialId,
        endorserId,
        endorsedAt: new Date(),
      });

      logSecurityEvent('SKILL_ENDORSED' as any, 'info' as any, 'Skill credential endorsed', {
        credentialId,
        endorserId,
        endorsementCount: endorsements,
      });

      return credential;
    } catch (error) {
      logSecurityEvent('SKILL_ENDORSEMENT_FAILED' as any, 'error' as any, 'Failed to endorse skill credential', {
        credentialId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateSkillCompetencyReport(userId: string): Promise<any> {
    try {
      const profileQuery = await this.db
        .collection('user_competency_profiles')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (profileQuery.empty) throw new Error('Competency profile not found');

      const profile = profileQuery.docs[0].data() as UserCompetencyProfile;

      const report = {
        reportId: `skill_report_${userId}_${Date.now()}`,
        userId,
        overallProficiency: profile.overallProficiency,
        credentialCount: profile.credentials.length,
        verifiedCredentials: profile.credentials.filter((c) => c.isVerified).length,
        badgeCount: profile.badgeCompletions.length,
        competencyAreas: profile.competencyAreas,
        certificationReadiness: profile.certificationReadiness,
        generatedAt: new Date(),
      };

      await this.db.collection('skill_competency_reports').doc(report.reportId).set(report);

      logSecurityEvent('SKILL_COMPETENCY_REPORT_GENERATED' as any, 'info' as any, 'Skill competency report generated', {
        userId,
        overallProficiency: profile.overallProficiency,
      });

      return report;
    } catch (error) {
      logSecurityEvent('SKILL_COMPETENCY_REPORT_FAILED' as any, 'error' as any, 'Failed to generate skill competency report', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private buildCompetencyAreas(credentials: SkillCredential[]): CompetencyArea[] {
    const areas: CompetencyArea[] = [];

    const grouped = credentials.reduce((acc, cred) => {
      if (!acc[cred.skillCategory]) {
        acc[cred.skillCategory] = [];
      }
      acc[cred.skillCategory].push(cred);
      return acc;
    }, {} as Record<string, SkillCredential[]>);

    Object.entries(grouped).forEach(([category, creds]) => {
      const proficiencyPercentage =
        creds.length > 0 ? creds.reduce((sum, c) => sum + c.proficiencyScore, 0) / creds.length : 0;

      areas.push({
        areaId: `area_${category}_${Date.now()}`,
        areaName: category,
        proficiencyPercentage,
        skillsAcquired: creds.map((c) => c.skillName),
        masteryCertificates: creds.filter((c) => c.isVerified && c.level === 'expert').map((c) => c.credentialId),
        recommendedNextSkills: this.recommendNextSkills(creds),
      });
    });

    return areas;
  }

  private calculateOverallProficiency(credentials: SkillCredential[]): number {
    if (credentials.length === 0) return 0;
    return credentials.reduce((sum, c) => sum + c.proficiencyScore, 0) / credentials.length;
  }

  private async assessCertificationReadiness(userId: string, credentials: SkillCredential[]): Promise<CertificationReadiness[]> {
    const readinessArray: CertificationReadiness[] = [];

    const certifications = await this.db.collection('certifications').limit(10).get();

    for (const certDoc of certifications.docs) {
      const cert = certDoc.data() as any;
      const requiredSkills = cert.requiredSkills || [];

      const missingSkills = requiredSkills.filter(
        (skillId: string) => !credentials.some((c) => c.skillId === skillId && c.isVerified)
      );

      const readinessScore = Math.max(0, 100 - missingSkills.length * 20);

      readinessArray.push({
        certificationId: cert.certificationId,
        certificationName: cert.certificationName,
        readinessScore,
        missingCompetencies: missingSkills,
        estimatedReadinessDate: new Date(Date.now() + missingSkills.length * 7 * 24 * 60 * 60 * 1000),
      });
    }

    return readinessArray;
  }

  private recommendNextSkills(credentials: SkillCredential[]): string[] {
    const recommendations: string[] = [];

    credentials.forEach((cred) => {
      if (cred.level === 'beginner') {
        recommendations.push(`Advance ${cred.skillName} to intermediate level`);
      } else if (cred.level === 'intermediate') {
        recommendations.push(`Progress ${cred.skillName} to advanced level`);
      }
    });

    return recommendations;
  }
}

export const skillCredentialsCompetencyBadgesService = new SkillCredentialsCompetencyBadgesService();

import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CompetencyMap {
  competencyId: string;
  userId: string;
  conceptId: string;
  competencyName: string;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
  masteryPercentage: number;
  assessmentHistory: AssessmentRecord[];
  skillProgression: SkillProgression[];
  blockers: string[];
  nextMilestones: string[];
  estimatedMasteryDate: Date;
  masterDate?: Date;
  lastUpdated: Date;
}

export interface AssessmentRecord {
  assessmentId: string;
  score: number;
  assessmentDate: Date;
  assessmentType: string;
}

export interface SkillProgression {
  skillId: string;
  skillName: string;
  currentLevel: number;
  maxLevel: number;
  progressPercentage: number;
  prerequisitesMet: boolean;
}

export interface MasteryTrack {
  trackId: string;
  userId: string;
  conceptId: string;
  masteryLevel: number;
  attemptCount: number;
  firstAttemptDate: Date;
  masterDate?: Date;
  retentionScore: number;
  consistencyScore: number;
}

export interface CompetencyFramework {
  frameworkId: string;
  conceptId: string;
  competencies: Competency[];
  prerequisites: string[];
  estimatedLearningTime: number;
  createdAt: Date;
}

export interface Competency {
  competencyId: string;
  name: string;
  description: string;
  level: number;
  criteria: string[];
  assessmentCriteria: string[];
}

class MasteryCompetencyTrackingService {
  private db = getFirestore();

  async trackConceptMastery(
    userId: string,
    conceptId: string,
    assessmentScore: number,
    assessmentId: string
  ): Promise<CompetencyMap> {
    try {
      const competencyDocId = `competency_${userId}_${conceptId}`;
      const competencyDoc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      let competency: CompetencyMap;

      if (!competencyDoc.exists) {
        competency = {
          competencyId: competencyDocId,
          userId,
          conceptId,
          competencyName: `Mastery of ${conceptId}`,
          masteryLevel: 0,
          masteryPercentage: assessmentScore,
          assessmentHistory: [],
          skillProgression: [],
          blockers: [],
          nextMilestones: ['Complete initial assessment', 'Achieve 50% proficiency', 'Reach 75% proficiency'],
          estimatedMasteryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(),
        };
      } else {
        competency = competencyDoc.data() as CompetencyMap;
      }

      const newRecord: AssessmentRecord = {
        assessmentId,
        score: assessmentScore,
        assessmentDate: new Date(),
        assessmentType: 'formative',
      };

      competency.assessmentHistory.push(newRecord);
      competency.masteryPercentage = this.calculateMasteryPercentage(competency.assessmentHistory);
      competency.masteryLevel = this.determineMasteryLevel(competency.masteryPercentage);
      competency.lastUpdated = new Date();

      if (competency.masteryPercentage >= 80 && !competency.masterDate) {
        competency.masterDate = new Date();
      }

      await this.db.collection('competency_maps').doc(competencyDocId).set(competency);

      logSecurityEvent('MASTERY_TRACKED' as any, 'info' as any, 'Concept mastery tracked', {
        userId,
        conceptId,
        masteryLevel: competency.masteryLevel,
      });

      return competency;
    } catch (error) {
      logSecurityEvent('MASTERY_TRACKING_FAILED' as any, 'error' as any, 'Failed to track mastery', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getCompetencyMap(userId: string, conceptId: string): Promise<CompetencyMap | null> {
    try {
      const competencyDocId = `competency_${userId}_${conceptId}`;
      const doc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as CompetencyMap;
    } catch (error) {
      logSecurityEvent('COMPETENCY_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve competency map', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async mapCompetencyFramework(
    conceptId: string,
    competencies: Competency[],
    prerequisites: string[],
    estimatedLearningTime: number
  ): Promise<CompetencyFramework> {
    try {
      const frameworkId = `framework_${conceptId}_${Date.now()}`;

      const framework: CompetencyFramework = {
        frameworkId,
        conceptId,
        competencies,
        prerequisites,
        estimatedLearningTime,
        createdAt: new Date(),
      };

      await this.db.collection('competency_frameworks').doc(frameworkId).set(framework);

      logSecurityEvent('FRAMEWORK_MAPPED' as any, 'info' as any, 'Competency framework mapped', {
        conceptId,
        competencyCount: competencies.length,
      });

      return framework;
    } catch (error) {
      logSecurityEvent('FRAMEWORK_MAPPING_FAILED' as any, 'error' as any, 'Failed to map framework', {
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackSkillProgression(
    userId: string,
    conceptId: string,
    skillId: string,
    skillName: string,
    currentLevel: number,
    maxLevel: number
  ): Promise<SkillProgression> {
    try {
      const progressPercentage = (currentLevel / maxLevel) * 100;
      const prerequisitesMet = await this.checkPrerequisitesMet(userId, conceptId);

      const progression: SkillProgression = {
        skillId,
        skillName,
        currentLevel,
        maxLevel,
        progressPercentage,
        prerequisitesMet,
      };

      const competencyDocId = `competency_${userId}_${conceptId}`;
      const competencyDoc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      if (competencyDoc.exists) {
        const competency = competencyDoc.data() as CompetencyMap;
        competency.skillProgression.push(progression);
        await this.db.collection('competency_maps').doc(competencyDocId).update({
          skillProgression: competency.skillProgression,
        });
      }

      logSecurityEvent('SKILL_PROGRESSION_TRACKED' as any, 'info' as any, 'Skill progression tracked', {
        userId,
        skillId,
        currentLevel,
      });

      return progression;
    } catch (error) {
      logSecurityEvent('SKILL_PROGRESSION_FAILED' as any, 'error' as any, 'Failed to track skill progression', {
        userId,
        skillId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async identifyLearningBlockers(userId: string, conceptId: string): Promise<string[]> {
    try {
      const competencyDocId = `competency_${userId}_${conceptId}`;
      const competencyDoc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      if (!competencyDoc.exists) {
        return [];
      }

      const competency = competencyDoc.data() as CompetencyMap;
      const blockers: string[] = [];

      if (competency.masteryPercentage < 50) {
        blockers.push('Fundamental understanding gap - review core concepts');
      }

      if (competency.assessmentHistory.length < 3) {
        blockers.push('Insufficient practice - complete more exercises');
      }

      const recentScores = competency.assessmentHistory.slice(-5);
      if (recentScores.length > 0 && recentScores.every((r) => r.score < 60)) {
        blockers.push('Consistent low performance - seek additional tutoring');
      }

      if (competency.skillProgression.some((s) => !s.prerequisitesMet)) {
        blockers.push('Prerequisites not met - review prerequisite skills');
      }

      await this.db.collection('competency_maps').doc(competencyDocId).update({
        blockers,
      });

      logSecurityEvent('BLOCKERS_IDENTIFIED' as any, 'info' as any, 'Learning blockers identified', {
        userId,
        conceptId,
        blockerCount: blockers.length,
      });

      return blockers;
    } catch (error) {
      logSecurityEvent('BLOCKER_IDENTIFICATION_FAILED' as any, 'error' as any, 'Failed to identify blockers', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateMasteryReport(userId: string, conceptId: string): Promise<any> {
    try {
      const competencyDocId = `competency_${userId}_${conceptId}`;
      const competencyDoc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      if (!competencyDoc.exists) {
        throw new Error('Competency map not found');
      }

      const competency = competencyDoc.data() as CompetencyMap;

      const report = {
        reportId: `report_${Date.now()}`,
        userId,
        conceptId,
        masteryLevel: competency.masteryLevel,
        masteryPercentage: competency.masteryPercentage,
        assessmentCount: competency.assessmentHistory.length,
        averageScore: competency.assessmentHistory.reduce((sum, r) => sum + r.score, 0) / competency.assessmentHistory.length,
        skillCount: competency.skillProgression.length,
        blockerCount: competency.blockers.length,
        estimatedMasteryDate: competency.estimatedMasteryDate,
        readinessForAdvanced: competency.masteryLevel >= 3,
        generatedAt: new Date(),
      };

      await this.db.collection('mastery_reports').doc(report.reportId).set(report);

      logSecurityEvent('MASTERY_REPORT_GENERATED' as any, 'info' as any, 'Mastery report generated', {
        userId,
        conceptId,
        masteryLevel: competency.masteryLevel,
      });

      return report;
    } catch (error) {
      logSecurityEvent('REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate report', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculateMasteryPercentage(assessmentHistory: AssessmentRecord[]): number {
    if (assessmentHistory.length === 0) return 0;

    const weights = [0.2, 0.3, 0.5]; // older, recent, most recent
    let weightedSum = 0;
    let weightSum = 0;

    const recentAssessments = assessmentHistory.slice(-3);

    recentAssessments.forEach((assessment, index) => {
      const weight = weights[index] || 0.5;
      weightedSum += assessment.score * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? weightedSum / weightSum : 0;
  }

  private determineMasteryLevel(masteryPercentage: number): 0 | 1 | 2 | 3 | 4 | 5 {
    if (masteryPercentage < 20) return 0;
    if (masteryPercentage < 40) return 1;
    if (masteryPercentage < 60) return 2;
    if (masteryPercentage < 80) return 3;
    if (masteryPercentage < 90) return 4;
    return 5;
  }

  private async checkPrerequisitesMet(userId: string, conceptId: string): Promise<boolean> {
    const frameworkDoc = await this.db
      .collection('competency_frameworks')
      .where('conceptId', '==', conceptId)
      .limit(1)
      .get();

    if (frameworkDoc.empty) return true;

    const framework = frameworkDoc.docs[0].data() as CompetencyFramework;

    for (const prereq of framework.prerequisites) {
      const competencyDocId = `competency_${userId}_${prereq}`;
      const competencyDoc = await this.db.collection('competency_maps').doc(competencyDocId).get();

      if (!competencyDoc.exists) return false;

      const competency = competencyDoc.data() as CompetencyMap;
      if (competency.masteryLevel < 3) return false;
    }

    return true;
  }
}

export const masteryCompetencyTrackingService = new MasteryCompetencyTrackingService();

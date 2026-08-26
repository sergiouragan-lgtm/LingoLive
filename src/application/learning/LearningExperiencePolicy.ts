export type LearnerAgeGroup = 'CHILD' | 'TEEN' | 'ADULT';

export interface LearningExperience {
  sessionMinutes: number;
  maxActivitiesPerSession: number;
  feedbackStyle: 'playful' | 'encouraging' | 'direct';
  requireGuardianForLiveFeatures: boolean;
  allowOpenEndedAi: boolean;
}

export class LearningExperiencePolicy {
  static forAgeGroup(ageGroup: LearnerAgeGroup): LearningExperience {
    if (ageGroup === 'CHILD') {
      return { sessionMinutes: 10, maxActivitiesPerSession: 4, feedbackStyle: 'playful', requireGuardianForLiveFeatures: true, allowOpenEndedAi: false };
    }
    if (ageGroup === 'TEEN') {
      return { sessionMinutes: 20, maxActivitiesPerSession: 7, feedbackStyle: 'encouraging', requireGuardianForLiveFeatures: false, allowOpenEndedAi: true };
    }
    return { sessionMinutes: 30, maxActivitiesPerSession: 10, feedbackStyle: 'direct', requireGuardianForLiveFeatures: false, allowOpenEndedAi: true };
  }
}

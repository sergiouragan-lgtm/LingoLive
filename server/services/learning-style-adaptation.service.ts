import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LearningStyleProfile {
  profileId: string;
  userId: string;
  primaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
  styleScores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    readingWriting: number;
  };
  confidence: number;
  optimalLearningTime: string;
  preferredContentFormats: string[];
  preferredInteractionPatterns: string[];
  cognitiveLoadThreshold: number;
  learningPacePreference: string;
  assessmentPreference: string;
  generatedAt: Date;
  updatedAt: Date;
}

export interface ContentFormatMatch {
  matchId: string;
  contentId: string;
  userId: string;
  format: string;
  styleAlignment: number;
  effectiveness: number;
  engagementScore: number;
  recommendationStrength: 'strong' | 'moderate' | 'weak';
  evaluatedAt: Date;
}

export interface InteractionOptimization {
  optimizationId: string;
  userId: string;
  interactionType: string;
  styleAlignment: number;
  currentCognitiveLoad: number;
  recommendedLoad: number;
  adjustments: Record<string, any>;
  appliedAt: Date;
}

export interface PresentationAdaptation {
  adaptationId: string;
  contentId: string;
  userId: string;
  learningStyle: string;
  visualElements: boolean;
  audioElements: boolean;
  interactiveElements: boolean;
  readingElements: boolean;
  kinestheticElements: boolean;
  multimodalBalance: Record<string, number>;
  appliedAt: Date;
}

export interface CognitiveLoadMetrics {
  metricsId: string;
  userId: string;
  sessionId: string;
  currentLoad: number;
  threshold: number;
  breakSuggested: boolean;
  adjustmentsMade: string[];
  effectivenessScore: number;
  measuredAt: Date;
}

class LearningStyleAdaptationService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async detectLearningStyle(userId: string): Promise<LearningStyleProfile> {
    try {
      const profileId = `style-${userId}`;

      const interactionsSnapshot = await this.db
        .collection('learning_interactions')
        .where('userId', '==', userId)
        .limit(50)
        .get();

      const interactions = interactionsSnapshot.docs.map(d => d.data() as any);

      const scores = {
        visual: this.calculateStyleScore(interactions, 'visual'),
        auditory: this.calculateStyleScore(interactions, 'auditory'),
        kinesthetic: this.calculateStyleScore(interactions, 'kinesthetic'),
        readingWriting: this.calculateStyleScore(interactions, 'reading-writing'),
      };

      const primaryStyle = this.determinePrimaryStyle(scores);
      const confidence = this.calculateConfidence(scores);

      const profile: LearningStyleProfile = {
        profileId,
        userId,
        primaryStyle,
        styleScores: scores,
        confidence,
        optimalLearningTime: this.findOptimalLearningTime(interactions),
        preferredContentFormats: this.identifyPreferredFormats(scores, interactions),
        preferredInteractionPatterns: this.identifyInteractionPatterns(scores),
        cognitiveLoadThreshold: 75,
        learningPacePreference: scores.kinesthetic > 60 ? 'hands-on' : 'structured',
        assessmentPreference: primaryStyle === 'visual' ? 'diagram-based' : 'varied',
        generatedAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.collection('learning_style_profiles').doc(userId).set(profile);
      logSecurityEvent('LEARNING_STYLE_DETECTED' as any, 'info' as any, 'Learning style detected', { userId, primaryStyle });
      return profile;
    } catch (error) {
      logSecurityEvent('STYLE_DETECTION_FAILED' as any, 'error' as any, 'Learning style detection failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async matchContentToStyle(
    userId: string,
    contentId: string,
    contentFormats: string[]
  ): Promise<ContentFormatMatch> {
    try {
      const styleDoc = await this.db.collection('learning_style_profiles').doc(userId).get();
      if (!styleDoc.exists) throw new Error('Style profile not found');

      const profile = styleDoc.data() as LearningStyleProfile;
      const matchId = `match-${userId}-${contentId}-${Date.now()}`;

      const styleAlignment = this.calculateAlignment(profile.styleScores, contentFormats);
      const effectiveness = 0.75 + styleAlignment * 0.25;

      const match: ContentFormatMatch = {
        matchId,
        contentId,
        userId,
        format: contentFormats[0] || 'mixed',
        styleAlignment,
        effectiveness,
        engagementScore: 70 + styleAlignment * 20,
        recommendationStrength: styleAlignment > 0.8 ? 'strong' : styleAlignment > 0.6 ? 'moderate' : 'weak',
        evaluatedAt: new Date(),
      };

      await this.db.collection('content_format_matches').doc(matchId).set(match);
      logSecurityEvent('CONTENT_MATCHED_TO_STYLE' as any, 'info' as any, 'Content matched to learning style', { userId, contentId });
      return match;
    } catch (error) {
      logSecurityEvent('CONTENT_MATCHING_FAILED' as any, 'error' as any, 'Content matching failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async optimizeInteractionPattern(
    userId: string,
    interactionType: string
  ): Promise<InteractionOptimization> {
    try {
      const optimizationId = `opt-${userId}-${interactionType}-${Date.now()}`;

      const styleDoc = await this.db.collection('learning_style_profiles').doc(userId).get();
      const profile = styleDoc.exists ? (styleDoc.data() as LearningStyleProfile) : null;

      const styleAlignment = profile ? this.getAlignmentScore(profile, interactionType) : 0.5;

      const optimization: InteractionOptimization = {
        optimizationId,
        userId,
        interactionType,
        styleAlignment,
        currentCognitiveLoad: 60,
        recommendedLoad: profile?.cognitiveLoadThreshold || 75,
        adjustments: {
          pacing: styleAlignment > 0.7 ? 'accelerate' : 'maintain',
          scaffolding: styleAlignment < 0.6 ? 'increase' : 'maintain',
          multimodality: styleAlignment < 0.5 ? 'enhance' : 'maintain',
        },
        appliedAt: new Date(),
      };

      await this.db.collection('interaction_optimizations').doc(optimizationId).set(optimization);
      logSecurityEvent('INTERACTION_OPTIMIZED' as any, 'info' as any, 'Interaction pattern optimized', { userId, interactionType });
      return optimization;
    } catch (error) {
      logSecurityEvent('INTERACTION_OPTIMIZATION_FAILED' as any, 'error' as any, 'Interaction optimization failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async adaptPresentation(
    contentId: string,
    userId: string
  ): Promise<PresentationAdaptation> {
    try {
      const adaptationId = `adapt-${contentId}-${userId}-${Date.now()}`;

      const styleDoc = await this.db.collection('learning_style_profiles').doc(userId).get();
      const profile = styleDoc.exists ? (styleDoc.data() as LearningStyleProfile) : null;

      const primaryStyle = profile?.primaryStyle || 'mixed';
      const styleScores = profile?.styleScores || { visual: 0.5, auditory: 0.5, kinesthetic: 0.5, readingWriting: 0.5 };

      const adaptation: PresentationAdaptation = {
        adaptationId,
        contentId,
        userId,
        learningStyle: primaryStyle,
        visualElements: styleScores.visual > 50,
        audioElements: styleScores.auditory > 50,
        interactiveElements: styleScores.kinesthetic > 50,
        readingElements: styleScores.readingWriting > 50,
        kinestheticElements: styleScores.kinesthetic > 60,
        multimodalBalance: {
          visual: styleScores.visual / 100,
          auditory: styleScores.auditory / 100,
          kinesthetic: styleScores.kinesthetic / 100,
          readingWriting: styleScores.readingWriting / 100,
        },
        appliedAt: new Date(),
      };

      await this.db.collection('presentation_adaptations').doc(adaptationId).set(adaptation);
      logSecurityEvent('PRESENTATION_ADAPTED' as any, 'info' as any, 'Presentation adapted for learning style', { contentId, userId });
      return adaptation;
    } catch (error) {
      logSecurityEvent('PRESENTATION_ADAPTATION_FAILED' as any, 'error' as any, 'Presentation adaptation failed', { contentId, error: (error as Error).message });
      throw error;
    }
  }

  public async manageCognitiveLoad(userId: string, sessionId: string): Promise<CognitiveLoadMetrics> {
    try {
      const metricsId = `load-${userId}-${sessionId}`;

      const styleDoc = await this.db.collection('learning_style_profiles').doc(userId).get();
      const profile = styleDoc.exists ? (styleDoc.data() as LearningStyleProfile) : null;
      const threshold = profile?.cognitiveLoadThreshold || 75;

      const metrics: CognitiveLoadMetrics = {
        metricsId,
        userId,
        sessionId,
        currentLoad: 65,
        threshold,
        breakSuggested: 65 > threshold * 0.8,
        adjustmentsMade: ['increased_visual_scaffolding', 'added_break_prompts'],
        effectivenessScore: 0.82,
        measuredAt: new Date(),
      };

      await this.db.collection('cognitive_load_metrics').doc(metricsId).set(metrics);
      logSecurityEvent('COGNITIVE_LOAD_MANAGED' as any, 'info' as any, 'Cognitive load managed', { userId, sessionId });
      return metrics;
    } catch (error) {
      logSecurityEvent('COGNITIVE_LOAD_MANAGEMENT_FAILED' as any, 'error' as any, 'Cognitive load management failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  private calculateStyleScore(interactions: any[], style: string): number {
    let score = 0;
    let count = 0;

    for (const interaction of interactions) {
      if (interaction.format === style || interaction.contentType === style) {
        score += interaction.engagementScore || 0;
        count += 1;
      }
    }

    return count > 0 ? score / count : 50;
  }

  private determinePrimaryStyle(scores: Record<string, number>): 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed' {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (entries[0][1] - entries[1][1] > 10) {
      return entries[0][0] as any;
    }
    return 'mixed';
  }

  private calculateConfidence(scores: Record<string, number>): number {
    const sorted = Object.values(scores).sort((a, b) => b - a);
    return Math.min(1, (sorted[0] - sorted[1]) / 100);
  }

  private findOptimalLearningTime(interactions: any[]): string {
    const hours: Record<number, number> = {};
    for (const interaction of interactions) {
      const hour = new Date(interaction.timestamp?.toDate?.() || new Date()).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    }
    const topHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0];
    return topHour ? `${topHour}:00` : '14:00';
  }

  private identifyPreferredFormats(scores: Record<string, number>, interactions: any[]): string[] {
    const formats: string[] = [];
    if (scores.visual > 60) formats.push('diagrams', 'videos', 'images');
    if (scores.auditory > 60) formats.push('audio', 'lectures', 'podcasts');
    if (scores.kinesthetic > 60) formats.push('interactive', 'hands-on', 'simulations');
    if (scores.readingWriting > 60) formats.push('text', 'articles', 'written-exercises');
    return formats;
  }

  private identifyInteractionPatterns(scores: Record<string, number>): string[] {
    const patterns: string[] = [];
    if (scores.visual > 70) patterns.push('visual-exploration');
    if (scores.auditory > 70) patterns.push('discussion-based');
    if (scores.kinesthetic > 70) patterns.push('experiment-based');
    return patterns;
  }

  private calculateAlignment(scores: Record<string, number>, formats: string[]): number {
    let alignment = 0;
    for (const format of formats) {
      if (format.includes('video') || format.includes('image')) alignment += scores.visual;
      if (format.includes('audio') || format.includes('podcast')) alignment += scores.auditory;
      if (format.includes('interactive') || format.includes('exercise')) alignment += scores.kinesthetic;
      if (format.includes('text') || format.includes('article')) alignment += scores.readingWriting;
    }
    return Math.min(1, alignment / (formats.length * 100));
  }

  private getAlignmentScore(profile: LearningStyleProfile, interactionType: string): number {
    if (interactionType.includes('visual')) return profile.styleScores.visual / 100;
    if (interactionType.includes('audio')) return profile.styleScores.auditory / 100;
    if (interactionType.includes('interactive')) return profile.styleScores.kinesthetic / 100;
    if (interactionType.includes('reading')) return profile.styleScores.readingWriting / 100;
    return 0.5;
  }
}

export const learningStyleAdaptationService = new LearningStyleAdaptationService();

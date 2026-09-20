import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface TutorResponse {
  responseId: string;
  userId: string;
  questionId: string;
  userAnswer: string;
  responseContent: {
    text: string;
    audio?: string;
    video?: string;
    visualizations?: string[];
  };
  method: 'direct' | 'socratic' | 'guided' | 'exploratory';
  difficulty: number;
  misconceptionsDetected: string[];
  corrections: string[];
  hints: string[];
  engagementLevel: number;
  estimatedLearningGain: number;
  generatedAt: Date;
}

export interface SocraticQuestion {
  questionId: string;
  parentResponseId: string;
  question: string;
  guidingConcepts: string[];
  expectedInsights: string[];
  difficulty: number;
  followUpQuestions: string[];
}

export interface MisconceptionPattern {
  patternId: string;
  userId: string;
  concept: string;
  misconception: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  correctionStrategy: string;
  lastObservedAt: Date;
}

export interface PersonalizedHint {
  hintId: string;
  questionId: string;
  userId: string;
  hintType: 'directional' | 'partial' | 'analogical' | 'example';
  hintContent: string;
  difficulty: number;
  effectivenessScore?: number;
  generatedAt: Date;
}

export interface ResponseQuality {
  responseId: string;
  clarity: number;
  relevance: number;
  pedagogicalValue: number;
  engagement: number;
  misconceptionCoverage: number;
  overallScore: number;
}

class AITutorResponseService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async generateTutorResponse(
    userId: string,
    questionId: string,
    userAnswer: string,
    context: Record<string, any>
  ): Promise<TutorResponse> {
    try {
      const responseId = `response-${userId}-${questionId}-${Date.now()}`;

      const misconceptions = await this.detectMisconceptions(userAnswer, context);
      const method = await this.selectResponseMethod(userAnswer, misconceptions);

      let responseContent = { text: '', audio: '', video: '' };

      if (method === 'socratic') {
        responseContent = await this.generateSocraticResponse(userAnswer, context);
      } else if (method === 'guided') {
        responseContent = await this.generateGuidedResponse(userAnswer, misconceptions);
      } else {
        responseContent = await this.generateDirectResponse(userAnswer, context);
      }

      const hints = await this.generatePersonalizedHints(questionId, userId, userAnswer);

      const response: TutorResponse = {
        responseId,
        userId,
        questionId,
        userAnswer,
        responseContent,
        method,
        difficulty: context.difficulty || 3,
        misconceptionsDetected: misconceptions,
        corrections: await this.generateCorrections(misconceptions),
        hints: hints.map(h => h.hintContent),
        engagementLevel: Math.min(100, 60 + misconceptions.length * 5),
        estimatedLearningGain: method === 'socratic' ? 0.45 : 0.35,
        generatedAt: new Date(),
      };

      await this.db.collection('tutor_responses').doc(responseId).set(response);
      logSecurityEvent('TUTOR_RESPONSE_GENERATED' as any, 'info' as any, 'Tutor response generated', { userId, questionId });
      return response;
    } catch (error) {
      logSecurityEvent('TUTOR_RESPONSE_GENERATION_FAILED' as any, 'error' as any, 'Tutor response generation failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async detectMisconceptions(userAnswer: string, context: Record<string, any>): Promise<string[]> {
    const misconceptions: string[] = [];

    if (context.correctAnswer && userAnswer.toLowerCase() !== context.correctAnswer.toLowerCase()) {
      misconceptions.push('incorrect_answer');
    }

    const grammar = await this.analyzeGrammarPattern(userAnswer);
    if (!grammar.isCorrect) {
      misconceptions.push('grammar_error');
    }

    return misconceptions;
  }

  private async analyzeGrammarPattern(answer: string): Promise<{ isCorrect: boolean; errors: string[] }> {
    return { isCorrect: true, errors: [] };
  }

  private async selectResponseMethod(
    userAnswer: string,
    misconceptions: string[]
  ): Promise<'direct' | 'socratic' | 'guided' | 'exploratory'> {
    if (misconceptions.length === 0) return 'exploratory';
    if (misconceptions.length > 2) return 'guided';
    return 'socratic';
  }

  private async generateSocraticResponse(
    userAnswer: string,
    context: Record<string, any>
  ): Promise<{ text: string; audio: string; video: string }> {
    return {
      text: `That's an interesting answer. Let me ask you: What do you think about...?`,
      audio: '',
      video: '',
    };
  }

  private async generateGuidedResponse(
    userAnswer: string,
    misconceptions: string[]
  ): Promise<{ text: string; audio: string; video: string }> {
    return {
      text: `I see you're struggling with this. Let me break it down step by step.`,
      audio: '',
      video: '',
    };
  }

  private async generateDirectResponse(
    userAnswer: string,
    context: Record<string, any>
  ): Promise<{ text: string; audio: string; video: string }> {
    return {
      text: `Great work! Here's the correct answer: ${context.correctAnswer}`,
      audio: '',
      video: '',
    };
  }

  private async generateCorrections(misconceptions: string[]): Promise<string[]> {
    return misconceptions.map(m => `Correction for: ${m}`);
  }

  public async generatePersonalizedHints(
    questionId: string,
    userId: string,
    userAnswer: string
  ): Promise<PersonalizedHint[]> {
    try {
      const hints: PersonalizedHint[] = [];

      const directionalHint: PersonalizedHint = {
        hintId: `hint-${questionId}-1`,
        questionId,
        userId,
        hintType: 'directional',
        hintContent: 'Try thinking about the grammatical structure...',
        difficulty: 2,
        generatedAt: new Date(),
      };

      hints.push(directionalHint);

      await this.db.collection('personalized_hints').doc(directionalHint.hintId).set(directionalHint);
      logSecurityEvent('HINTS_GENERATED' as any, 'info' as any, 'Personalized hints generated', { questionId, userId });
      return hints;
    } catch (error) {
      logSecurityEvent('HINT_GENERATION_FAILED' as any, 'error' as any, 'Hint generation failed', { questionId, error: (error as Error).message });
      throw error;
    }
  }

  public async recordMisconceptionPattern(
    userId: string,
    concept: string,
    misconception: string
  ): Promise<MisconceptionPattern> {
    try {
      const patternId = `pattern-${userId}-${concept}-${Date.now()}`;

      const pattern: MisconceptionPattern = {
        patternId,
        userId,
        concept,
        misconception,
        frequency: 1,
        severity: 'medium',
        correctionStrategy: 'socratic_questioning',
        lastObservedAt: new Date(),
      };

      await this.db.collection('misconception_patterns').doc(patternId).set(pattern);
      logSecurityEvent('MISCONCEPTION_RECORDED' as any, 'info' as any, 'Misconception pattern recorded', { userId, concept });
      return pattern;
    } catch (error) {
      logSecurityEvent('MISCONCEPTION_RECORDING_FAILED' as any, 'error' as any, 'Misconception recording failed', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async evaluateResponseQuality(responseId: string): Promise<ResponseQuality> {
    try {
      const responseDoc = await this.db.collection('tutor_responses').doc(responseId).get();
      if (!responseDoc.exists) throw new Error('Response not found');

      const response = responseDoc.data() as TutorResponse;

      const quality: ResponseQuality = {
        responseId,
        clarity: 85,
        relevance: 90,
        pedagogicalValue: 80,
        engagement: response.engagementLevel,
        misconceptionCoverage: Math.min(100, response.misconceptionsDetected.length * 25),
        overallScore: 85,
      };

      await this.db.collection('response_quality_metrics').doc(responseId).set(quality);
      logSecurityEvent('RESPONSE_QUALITY_EVALUATED' as any, 'info' as any, 'Response quality evaluated', { responseId });
      return quality;
    } catch (error) {
      logSecurityEvent('QUALITY_EVALUATION_FAILED' as any, 'error' as any, 'Quality evaluation failed', { responseId, error: (error as Error).message });
      throw error;
    }
  }

  public async getTutorResponse(responseId: string): Promise<TutorResponse> {
    try {
      const responseDoc = await this.db.collection('tutor_responses').doc(responseId).get();
      if (!responseDoc.exists) throw new Error('Response not found');

      return responseDoc.data() as TutorResponse;
    } catch (error) {
      logSecurityEvent('TUTOR_RESPONSE_FETCH_FAILED' as any, 'error' as any, 'Tutor response fetch failed', { responseId, error: (error as Error).message });
      throw error;
    }
  }
}

export const aiTutorResponseService = new AITutorResponseService();

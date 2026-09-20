import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface FormativeAssessment {
  assessmentId: string;
  userId: string;
  conceptId: string;
  assessmentType: 'quiz' | 'practice' | 'interactive' | 'diagnostic';
  questions: Question[];
  studentResponses: StudentResponse[];
  feedbackGenerated: FeedbackItem[];
  overallScore: number;
  completionPercentage: number;
  timeSpent: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  adaptiveNextSteps: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Question {
  questionId: string;
  content: string;
  questionType: 'multiple-choice' | 'fill-blank' | 'essay' | 'matching' | 'ordering';
  difficulty: number;
  learningObjective: string;
  correctAnswer?: string;
  maxPoints: number;
}

export interface StudentResponse {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timeSpent: number;
  confidenceLevel: number;
  misconceptionDetected?: string;
}

export interface FeedbackItem {
  feedbackId: string;
  questionId: string;
  feedbackType: 'immediate' | 'constructive' | 'corrective' | 'reinforcing';
  feedbackText: string;
  suggestedResource?: string;
  generatedAt: Date;
}

export interface ConceptMastery {
  conceptId: string;
  userId: string;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
  masteryPercentage: number;
  assessmentCount: number;
  averageScore: number;
  readinessForAdvanced: boolean;
  needsRemediation: boolean;
  lastAssessedAt: Date;
}

class RealTimeFormativeAssessmentService {
  private db = getFirestore();

  async createFormativeAssessment(
    userId: string,
    conceptId: string,
    assessmentType: 'quiz' | 'practice' | 'interactive' | 'diagnostic',
    questions: Question[],
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<FormativeAssessment> {
    try {
      const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const assessment: FormativeAssessment = {
        assessmentId,
        userId,
        conceptId,
        assessmentType,
        questions,
        studentResponses: [],
        feedbackGenerated: [],
        overallScore: 0,
        completionPercentage: 0,
        timeSpent: 0,
        difficultyLevel,
        adaptiveNextSteps: [],
        createdAt: new Date(),
      };

      await this.db.collection('formative_assessments').doc(assessmentId).set(assessment);
      logSecurityEvent('ASSESSMENT_CREATED' as any, 'info' as any, 'Formative assessment created', {
        userId,
        conceptId,
        assessmentType,
      });

      return assessment;
    } catch (error) {
      logSecurityEvent('ASSESSMENT_CREATION_FAILED' as any, 'error' as any, 'Failed to create assessment', {
        userId,
        conceptId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async submitStudentResponse(
    assessmentId: string,
    questionId: string,
    studentAnswer: string,
    timeSpent: number,
    confidenceLevel: number
  ): Promise<StudentResponse> {
    try {
      const assessmentDoc = await this.db.collection('formative_assessments').doc(assessmentId).get();
      const assessment = assessmentDoc.data() as FormativeAssessment;

      const question = assessment.questions.find((q) => q.questionId === questionId);
      if (!question) throw new Error('Question not found');

      const isCorrect = this.evaluateAnswer(studentAnswer, question.correctAnswer || '');
      const pointsAwarded = isCorrect ? question.maxPoints : 0;

      const response: StudentResponse = {
        questionId,
        studentAnswer,
        isCorrect,
        pointsAwarded,
        timeSpent,
        confidenceLevel,
        misconceptionDetected: isCorrect ? undefined : this.detectMisconception(studentAnswer),
      };

      assessment.studentResponses.push(response);
      assessment.completionPercentage = (assessment.studentResponses.length / assessment.questions.length) * 100;
      assessment.timeSpent += timeSpent;

      await this.db.collection('formative_assessments').doc(assessmentId).update({
        studentResponses: assessment.studentResponses,
        completionPercentage: assessment.completionPercentage,
        timeSpent: assessment.timeSpent,
      });

      logSecurityEvent('RESPONSE_SUBMITTED' as any, 'info' as any, 'Student response submitted', {
        assessmentId,
        questionId,
        isCorrect,
      });

      return response;
    } catch (error) {
      logSecurityEvent('RESPONSE_SUBMISSION_FAILED' as any, 'error' as any, 'Failed to submit response', {
        assessmentId,
        questionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateImmediateFeedback(assessmentId: string, questionId: string): Promise<FeedbackItem> {
    try {
      const assessmentDoc = await this.db.collection('formative_assessments').doc(assessmentId).get();
      const assessment = assessmentDoc.data() as FormativeAssessment;

      const response = assessment.studentResponses.find((r) => r.questionId === questionId);
      if (!response) throw new Error('Response not found');

      const question = assessment.questions.find((q) => q.questionId === questionId);
      if (!question) throw new Error('Question not found');

      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let feedbackText = '';
      let feedbackType: 'immediate' | 'constructive' | 'corrective' | 'reinforcing' = 'immediate';

      if (response.isCorrect) {
        feedbackText = `Correct! You've demonstrated understanding of ${question.learningObjective}.`;
        feedbackType = 'reinforcing';
      } else {
        feedbackText = `Not quite. Let me help: ${response.misconceptionDetected || 'Try a different approach.'}`;
        feedbackType = 'corrective';
      }

      const feedback: FeedbackItem = {
        feedbackId,
        questionId,
        feedbackType,
        feedbackText,
        suggestedResource: question.learningObjective,
        generatedAt: new Date(),
      };

      assessment.feedbackGenerated.push(feedback);
      await this.db.collection('formative_assessments').doc(assessmentId).update({
        feedbackGenerated: assessment.feedbackGenerated,
      });

      logSecurityEvent('FEEDBACK_GENERATED' as any, 'info' as any, 'Immediate feedback generated', {
        assessmentId,
        questionId,
      });

      return feedback;
    } catch (error) {
      logSecurityEvent('FEEDBACK_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate feedback', {
        assessmentId,
        questionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async completeAssessment(assessmentId: string): Promise<FormativeAssessment> {
    try {
      const assessmentDoc = await this.db.collection('formative_assessments').doc(assessmentId).get();
      const assessment = assessmentDoc.data() as FormativeAssessment;

      const totalPoints = assessment.questions.reduce((sum, q) => sum + q.maxPoints, 0);
      const earnedPoints = assessment.studentResponses.reduce((sum, r) => sum + r.pointsAwarded, 0);
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

      const adaptiveNextSteps = this.generateAdaptiveNextSteps(assessment, score);

      await this.db.collection('formative_assessments').doc(assessmentId).update({
        overallScore: score,
        completedAt: new Date(),
        adaptiveNextSteps,
      });

      logSecurityEvent('ASSESSMENT_COMPLETED' as any, 'info' as any, 'Formative assessment completed', {
        assessmentId,
        overallScore: score,
      });

      return {
        ...assessment,
        overallScore: score,
        completedAt: new Date(),
        adaptiveNextSteps,
      };
    } catch (error) {
      logSecurityEvent('ASSESSMENT_COMPLETION_FAILED' as any, 'error' as any, 'Failed to complete assessment', {
        assessmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getAssessmentAnalysis(assessmentId: string): Promise<any> {
    try {
      const assessmentDoc = await this.db.collection('formative_assessments').doc(assessmentId).get();
      const assessment = assessmentDoc.data() as FormativeAssessment;

      const correctCount = assessment.studentResponses.filter((r) => r.isCorrect).length;
      const accuracyRate = (correctCount / assessment.studentResponses.length) * 100;
      const avgTimePerQuestion = assessment.timeSpent / assessment.studentResponses.length;
      const avgConfidence = assessment.studentResponses.reduce((sum, r) => sum + r.confidenceLevel, 0) / assessment.studentResponses.length;

      const analysis = {
        analysisId: `analysis_${Date.now()}`,
        assessmentId,
        accuracyRate,
        avgTimePerQuestion,
        avgConfidence,
        strengths: assessment.questions.filter((q) =>
          assessment.studentResponses.find((r) => r.questionId === q.questionId && r.isCorrect)
        ).map((q) => q.learningObjective),
        weaknesses: assessment.questions.filter((q) =>
          assessment.studentResponses.find((r) => r.questionId === q.questionId && !r.isCorrect)
        ).map((q) => q.learningObjective),
        recommendedReview: accuracyRate < 60,
        generatedAt: new Date(),
      };

      await this.db.collection('assessment_analyses').doc(analysis.analysisId).set(analysis);

      logSecurityEvent('ANALYSIS_GENERATED' as any, 'info' as any, 'Assessment analysis generated', {
        assessmentId,
        accuracyRate,
      });

      return analysis;
    } catch (error) {
      logSecurityEvent('ANALYSIS_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate analysis', {
        assessmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private evaluateAnswer(studentAnswer: string, correctAnswer: string): boolean {
    return studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  private detectMisconception(studentAnswer: string): string {
    const commonMisconceptions: { [key: string]: string } = {
      'incorrect': 'Review the core concept before proceeding.',
      'partial': 'You are close. Focus on the details.',
      'confused': 'There seems to be a conceptual gap. Try breaking it down.',
    };

    return commonMisconceptions['incorrect'] || 'Review and try again.';
  }

  private generateAdaptiveNextSteps(assessment: FormativeAssessment, score: number): string[] {
    const steps: string[] = [];

    if (score < 50) {
      steps.push('Review foundational concepts');
      steps.push('Complete guided practice exercises');
      steps.push('Request peer tutoring');
    } else if (score < 75) {
      steps.push('Practice additional similar problems');
      steps.push('Review commonly missed concepts');
      steps.push('Attempt intermediate difficulty questions');
    } else if (score < 90) {
      steps.push('Progress to advanced challenges');
      steps.push('Apply concepts to real-world scenarios');
      steps.push('Peer teach other students');
    } else {
      steps.push('Explore extension topics');
      steps.push('Create original problems');
      steps.push('Mentor struggling peers');
    }

    return steps;
  }
}

export const realTimeFormativeAssessmentService = new RealTimeFormativeAssessmentService();

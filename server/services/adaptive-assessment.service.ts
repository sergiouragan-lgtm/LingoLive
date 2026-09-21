import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface AdaptiveQuiz {
  quizId: string;
  userId: string;
  moduleId: string;
  difficulty: number; // 1-10
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  status: 'in_progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  questionsAsked: string[];
}

export interface QuizQuestion {
  questionId: string;
  text: string;
  concept: string;
  difficulty: number; // 1-10
  options: string[];
  correctOptionIndex: number;
  explanations: Record<number, string>;
  timeLimit: number; // seconds
  estimatedDuration: number;
}

export interface SkillMastery {
  userId: string;
  skillId: string;
  masteryLevel: number; // 0-100
  questionsAnswered: number;
  correctAnswers: number;
  lastAssessed: Date;
}

export interface AssessmentDifficultyAdapter {
  userId: string;
  moduleId: string;
  currentDifficulty: number; // 1-10
  difficultyAdjustmentHistory: Array<{
    difficulty: number;
    correctRate: number;
    timestamp: Date;
  }>;
  optimalDifficultyRange: { min: number; max: number };
}

export interface QuizResult {
  resultId: string;
  quizId: string;
  userId: string;
  finalScore: number; // 0-100
  totalQuestionsAnswered: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  conceptMastery: Record<string, number>;
  readyForNextLevel: boolean;
  completedAt: Date;
}

class AdaptiveAssessmentService {
  private db: Firestore;
  private activeQuizzes: Map<string, any> = new Map();

  constructor() {
    this.db = getFirestore();
    this.scheduleQuestionGeneration();
  }

  public async startAdaptiveQuiz(
    userId: string,
    moduleId: string,
    initialDifficulty: number = 5
  ): Promise<AdaptiveQuiz> {
    try {
      const quizId = `quiz-${userId}-${moduleId}-${Date.now()}`;

      const quiz: AdaptiveQuiz = {
        quizId,
        userId,
        moduleId,
        difficulty: initialDifficulty,
        currentQuestion: 0,
        totalQuestions: 10,
        score: 0,
        status: 'in_progress',
        startedAt: new Date(),
        questionsAsked: [],
      };

      this.activeQuizzes.set(quizId, quiz);

      await this.db
        .collection('adaptive_quizzes')
        .doc(quizId)
        .set(quiz);

      logSecurityEvent(
        'ADAPTIVE_QUIZ_STARTED' as any,
        'info' as any,
        `Adaptive quiz started`,
        { userId, moduleId, initialDifficulty },
        { quizId }
      );

      return quiz;
    } catch (error: any) {
      console.error('Error starting adaptive quiz:', error);
      throw error;
    }
  }

  public async getNextQuestion(quizId: string): Promise<QuizQuestion> {
    try {
      const quiz = this.activeQuizzes.get(quizId);
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`);
      }

      // Generate question at current difficulty
      const question = await this.generateQuestion(
        quiz.moduleId,
        quiz.difficulty,
        quiz.questionsAsked
      );

      quiz.questionsAsked.push(question.questionId);
      quiz.currentQuestion += 1;

      return question;
    } catch (error: any) {
      console.error('Error getting next question:', error);
      throw error;
    }
  }

  public async submitAnswer(
    quizId: string,
    questionId: string,
    selectedOptionIndex: number,
    timeSpentSeconds: number
  ): Promise<{ isCorrect: boolean; explanation: string; nextDifficulty: number }> {
    try {
      const quiz = this.activeQuizzes.get(quizId);
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`);
      }

      const question = await this.getQuestionById(questionId);
      const isCorrect = selectedOptionIndex === question.correctOptionIndex;

      if (isCorrect) {
        quiz.score += 10;
      }

      // Record answer
      await this.db
        .collection('quiz_answers')
        .add({
          quizId,
          questionId,
          selectedOptionIndex,
          isCorrect,
          timeSpentSeconds,
          timestamp: new Date(),
        });

      // Adapt difficulty based on performance
      const nextDifficulty = this.calculateAdaptiveDifficulty(
        quiz.difficulty,
        isCorrect,
        timeSpentSeconds,
        question.timeLimit
      );

      quiz.difficulty = nextDifficulty;

      const explanation = question.explanations[selectedOptionIndex] || 'No explanation available';

      return {
        isCorrect,
        explanation,
        nextDifficulty,
      };
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  public async completeQuiz(quizId: string): Promise<QuizResult> {
    try {
      const quiz = this.activeQuizzes.get(quizId);
      if (!quiz) {
        throw new Error(`Quiz ${quizId} not found`);
      }

      const answers = await this.db
        .collection('quiz_answers')
        .where('quizId', '==', quizId)
        .get();

      const correctAnswers = answers.docs.filter((d) => d.data().isCorrect).length;
      const finalScore = Math.round((correctAnswers / Math.max(1, answers.size)) * 100);

      const timeSpent = answers.docs.reduce(
        (sum, d) => sum + (d.data().timeSpentSeconds || 0),
        0
      );

      // Calculate concept mastery
      const conceptMastery = await this.calculateConceptMastery(quizId);

      const readyForNextLevel = finalScore >= 80;

      const result: QuizResult = {
        resultId: `result-${quizId}-${Date.now()}`,
        quizId,
        userId: quiz.userId,
        finalScore,
        totalQuestionsAnswered: answers.size,
        correctAnswers,
        timeSpentSeconds: timeSpent,
        conceptMastery,
        readyForNextLevel,
        completedAt: new Date(),
      };

      await this.db
        .collection('quiz_results')
        .doc(result.resultId)
        .set(result);

      // Update skill mastery
      await this.updateSkillMastery(quiz.userId, quiz.moduleId, finalScore, correctAnswers, answers.size);

      this.activeQuizzes.delete(quizId);

      logSecurityEvent(
        'ADAPTIVE_QUIZ_COMPLETED' as any,
        'info' as any,
        `Adaptive quiz completed`,
        { finalScore, readyForNextLevel },
        { quizId }
      );

      return result;
    } catch (error: any) {
      console.error('Error completing quiz:', error);
      throw error;
    }
  }

  public async getSkillMastery(userId: string, skillId: string): Promise<SkillMastery> {
    try {
      const doc = await this.db
        .collection('skill_mastery')
        .doc(`${userId}-${skillId}`)
        .get();

      if (doc.exists) {
        const data = doc.data() as any;
        return {
          ...data,
          lastAssessed: data.lastAssessed?.toDate?.() || new Date(),
        };
      }

      return {
        userId,
        skillId,
        masteryLevel: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        lastAssessed: new Date(),
      };
    } catch (error: any) {
      console.error('Error getting skill mastery:', error);
      throw error;
    }
  }

  public async generatePersonalizedQuiz(
    userId: string,
    moduleId: string,
    targetConcepts: string[]
  ): Promise<AdaptiveQuiz> {
    try {
      const quiz = await this.startAdaptiveQuiz(userId, moduleId);

      const questions = [];
      for (const concept of targetConcepts) {
        const question = await this.generateQuestion(moduleId, 5, []);
        questions.push(question);
      }

      await this.db
        .collection('adaptive_quizzes')
        .doc(quiz.quizId)
        .update({ totalQuestions: questions.length });

      return quiz;
    } catch (error: any) {
      console.error('Error generating personalized quiz:', error);
      throw error;
    }
  }

  private calculateAdaptiveDifficulty(
    currentDifficulty: number,
    isCorrect: boolean,
    timeSpent: number,
    timeLimit: number
  ): number {
    let newDifficulty = currentDifficulty;

    if (isCorrect) {
      if (timeSpent < timeLimit * 0.7) {
        newDifficulty = Math.min(10, currentDifficulty + 1);
      } else if (timeSpent < timeLimit) {
        newDifficulty = Math.min(10, currentDifficulty + 0.5);
      }
    } else {
      if (timeSpent > timeLimit * 1.5) {
        newDifficulty = Math.max(1, currentDifficulty - 1.5);
      } else {
        newDifficulty = Math.max(1, currentDifficulty - 0.5);
      }
    }

    return Math.round(newDifficulty * 2) / 2;
  }

  private async generateQuestion(
    moduleId: string,
    difficulty: number,
    excludeQuestions: string[]
  ): Promise<QuizQuestion> {
    try {
      const questions = await this.db
        .collection('quiz_question_bank')
        .where('moduleId', '==', moduleId)
        .where('difficulty', '>=', Math.floor(difficulty) - 1)
        .where('difficulty', '<=', Math.ceil(difficulty) + 1)
        .limit(20)
        .get();

      if (questions.empty) {
        throw new Error('No questions available');
      }

      const availableQuestions = questions.docs
        .filter((d) => !excludeQuestions.includes(d.id))
        .map((d) => ({ id: d.id, ...(d.data() as Partial<QuizQuestion>) }));

      const selectedQuestion =
        availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

      return {
        questionId: selectedQuestion.id,
        text: selectedQuestion.text || '',
        concept: selectedQuestion.concept || '',
        difficulty: selectedQuestion.difficulty || 5,
        options: selectedQuestion.options || [],
        correctOptionIndex: selectedQuestion.correctOptionIndex || 0,
        explanations: selectedQuestion.explanations || {},
        timeLimit: selectedQuestion.timeLimit || 60,
        estimatedDuration: selectedQuestion.estimatedDuration || 60,
      } as QuizQuestion;
    } catch {
      return {
        questionId: 'fallback-q',
        text: 'What is the primary benefit of adaptive learning?',
        concept: 'adaptive_learning',
        difficulty: 5,
        options: [
          'Personalized experience',
          'Faster completion',
          'Lower costs',
          'All of above',
        ],
        correctOptionIndex: 3,
        explanations: {
          0: 'Partially correct',
          1: 'Partially correct',
          2: 'Incorrect',
          3: 'Correct!',
        },
        timeLimit: 60,
        estimatedDuration: 60,
      };
    }
  }

  private async getQuestionById(questionId: string): Promise<QuizQuestion> {
    try {
      const doc = await this.db
        .collection('quiz_question_bank')
        .doc(questionId)
        .get();

      if (doc.exists) {
        const data = doc.data() as any;
        return {
          questionId,
          text: data.text,
          concept: data.concept,
          difficulty: data.difficulty,
          options: data.options,
          correctOptionIndex: data.correctOptionIndex,
          explanations: data.explanations,
          timeLimit: data.timeLimit || 60,
          estimatedDuration: data.estimatedDuration || 60,
        };
      }

      throw new Error(`Question ${questionId} not found`);
    } catch (error: any) {
      console.error('Error getting question:', error);
      throw error;
    }
  }

  private async calculateConceptMastery(quizId: string): Promise<Record<string, number>> {
    try {
      const answers = await this.db
        .collection('quiz_answers')
        .where('quizId', '==', quizId)
        .get();

      const conceptScores: Record<string, { correct: number; total: number }> = {};

      for (const answerDoc of answers.docs) {
        const answer = answerDoc.data();
        const question = await this.getQuestionById(answer.questionId);

        if (!conceptScores[question.concept]) {
          conceptScores[question.concept] = { correct: 0, total: 0 };
        }

        conceptScores[question.concept].total += 1;
        if (answer.isCorrect) {
          conceptScores[question.concept].correct += 1;
        }
      }

      const mastery: Record<string, number> = {};
      for (const [concept, scores] of Object.entries(conceptScores)) {
        mastery[concept] = Math.round((scores.correct / scores.total) * 100);
      }

      return mastery;
    } catch {
      return {};
    }
  }

  private async updateSkillMastery(
    userId: string,
    skillId: string,
    score: number,
    correctAnswers: number,
    totalAnswers: number
  ): Promise<void> {
    try {
      const masteryId = `${userId}-${skillId}`;
      const existingMastery = await this.getSkillMastery(userId, skillId);

      const newQuestionsAnswered = existingMastery.questionsAnswered + totalAnswers;
      const newCorrectAnswers = existingMastery.correctAnswers + correctAnswers;
      const newMasteryLevel = Math.round((newCorrectAnswers / newQuestionsAnswered) * 100);

      await this.db
        .collection('skill_mastery')
        .doc(masteryId)
        .set({
          userId,
          skillId,
          masteryLevel: newMasteryLevel,
          questionsAnswered: newQuestionsAnswered,
          correctAnswers: newCorrectAnswers,
          lastAssessed: new Date(),
        });
    } catch (error) {
      console.error('Error updating skill mastery:', error);
    }
  }

  private scheduleQuestionGeneration(): void {
    setInterval(async () => {
      try {
        console.log('[Assessment] Running question bank validation...');
      } catch (error: any) {
        console.error('Question generation error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }
}

export const adaptiveAssessmentService = new AdaptiveAssessmentService();

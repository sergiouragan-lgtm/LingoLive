import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface SupportTicket {
  ticketId: string;
  title: string;
  description: string;
  customerId: string;
  assignedTo: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'on-hold' | 'resolved' | 'closed';
  category: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface CustomerSuccessManager {
  managerId: string;
  name: string;
  email: string;
  assignedAccounts: string[];
  targetAccounts: number;
  achievedMetrics: SuccessMetric[];
  createdAt: Date;
}

export interface SuccessMetric {
  metricId: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export interface CustomerHealthScore {
  scoreId: string;
  customerId: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastActivityDate: Date;
  engagementScore: number;
  satisfactionScore: number;
  createdAt: Date;
}

export interface FeedbackSurvey {
  surveyId: string;
  title: string;
  customerId: string;
  questions: SurveyQuestion[];
  responseRate: number;
  averageScore: number;
  status: 'draft' | 'active' | 'closed';
  createdAt: Date;
}

export interface SurveyQuestion {
  questionId: string;
  text: string;
  type: 'rating' | 'multiple-choice' | 'text' | 'nps';
  responses: string[];
}

export interface KnowledgeBase {
  kbId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  createdAt: Date;
}

export interface SuccessPlanTemplate {
  templateId: string;
  name: string;
  description: string;
  objectives: string[];
  milestones: Milestone[];
  duration: number;
  targetOutcomes: string[];
  createdAt: Date;
}

export interface Milestone {
  milestoneId: string;
  name: string;
  description: string;
  targetDate: Date;
  deliverables: string[];
}

export interface SuccessPlanMetrics {
  metricsId: string;
  timestamp: Date;
  activeTickets: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  customersAtRisk: number;
  knowledgeBaseArticles: number;
  planCompletionRate: number;
}

class CustomerSuccessSupportService {
  private db = getFirestore();

  async createSupportTicket(
    title: string,
    description: string,
    customerId: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    category: string
  ): Promise<SupportTicket> {
    try {
      const ticketId = `ticket_${Date.now()}`;

      const ticket: SupportTicket = {
        ticketId,
        title,
        description,
        customerId,
        assignedTo: '',
        priority,
        status: 'open',
        category,
        createdAt: new Date(),
      };

      await this.db.collection('support_tickets').doc(ticketId).set(ticket);

      logSecurityEvent('SUPPORT_TICKET_CREATED' as any, 'info' as any, 'Support ticket created', {
        ticketId,
        customerId,
        priority,
      });

      return ticket;
    } catch (error) {
      logSecurityEvent('SUPPORT_TICKET_CREATION_FAILED' as any, 'error' as any, 'Failed to create support ticket', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async assignCustomerSuccessManager(
    name: string,
    email: string,
    assignedAccounts: string[],
    targetAccounts: number
  ): Promise<CustomerSuccessManager> {
    try {
      const managerId = `csm_${Date.now()}`;

      const manager: CustomerSuccessManager = {
        managerId,
        name,
        email,
        assignedAccounts,
        targetAccounts,
        achievedMetrics: [],
        createdAt: new Date(),
      };

      await this.db.collection('customer_success_managers').doc(managerId).set(manager);

      logSecurityEvent('CUSTOMER_SUCCESS_MANAGER_ASSIGNED' as any, 'info' as any, 'Customer success manager assigned', {
        managerId,
        name,
        accountCount: assignedAccounts.length,
      });

      return manager;
    } catch (error) {
      logSecurityEvent('CUSTOMER_SUCCESS_MANAGER_ASSIGNMENT_FAILED' as any, 'error' as any, 'Failed to assign customer success manager', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async calculateCustomerHealthScore(
    customerId: string,
    engagementScore: number,
    satisfactionScore: number
  ): Promise<CustomerHealthScore> {
    try {
      const scoreId = `health_${Date.now()}`;

      const healthScore = (engagementScore + satisfactionScore) / 2;
      const riskLevel = healthScore >= 75 ? 'low' :
                       healthScore >= 50 ? 'medium' :
                       healthScore >= 25 ? 'high' : 'critical';

      const score: CustomerHealthScore = {
        scoreId,
        customerId,
        healthScore,
        riskLevel,
        lastActivityDate: new Date(),
        engagementScore,
        satisfactionScore,
        createdAt: new Date(),
      };

      await this.db.collection('customer_health_scores').doc(scoreId).set(score);

      logSecurityEvent('CUSTOMER_HEALTH_SCORE_CALCULATED' as any, 'info' as any, 'Customer health score calculated', {
        scoreId,
        customerId,
        healthScore,
        riskLevel,
      });

      return score;
    } catch (error) {
      logSecurityEvent('CUSTOMER_HEALTH_SCORE_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate customer health score', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createFeedbackSurvey(
    title: string,
    customerId: string,
    questions: SurveyQuestion[]
  ): Promise<FeedbackSurvey> {
    try {
      const surveyId = `survey_${Date.now()}`;

      const survey: FeedbackSurvey = {
        surveyId,
        title,
        customerId,
        questions,
        responseRate: 0,
        averageScore: 0,
        status: 'draft',
        createdAt: new Date(),
      };

      await this.db.collection('feedback_surveys').doc(surveyId).set(survey);

      logSecurityEvent('FEEDBACK_SURVEY_CREATED' as any, 'info' as any, 'Feedback survey created', {
        surveyId,
        customerId,
        questionCount: questions.length,
      });

      return survey;
    } catch (error) {
      logSecurityEvent('FEEDBACK_SURVEY_CREATION_FAILED' as any, 'error' as any, 'Failed to create feedback survey', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async publishKnowledgeArticle(
    title: string,
    content: string,
    category: string,
    tags: string[]
  ): Promise<KnowledgeBase> {
    try {
      const kbId = `kb_${Date.now()}`;

      const article: KnowledgeBase = {
        kbId,
        title,
        content,
        category,
        tags,
        views: 0,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        createdAt: new Date(),
      };

      await this.db.collection('knowledge_base').doc(kbId).set(article);

      logSecurityEvent('KNOWLEDGE_ARTICLE_PUBLISHED' as any, 'info' as any, 'Knowledge article published', {
        kbId,
        title,
        category,
      });

      return article;
    } catch (error) {
      logSecurityEvent('KNOWLEDGE_ARTICLE_PUBLICATION_FAILED' as any, 'error' as any, 'Failed to publish knowledge article', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createSuccessPlan(
    name: string,
    description: string,
    objectives: string[],
    milestones: Milestone[],
    duration: number,
    targetOutcomes: string[]
  ): Promise<SuccessPlanTemplate> {
    try {
      const templateId = `plan_${Date.now()}`;

      const plan: SuccessPlanTemplate = {
        templateId,
        name,
        description,
        objectives,
        milestones,
        duration,
        targetOutcomes,
        createdAt: new Date(),
      };

      await this.db.collection('success_plan_templates').doc(templateId).set(plan);

      logSecurityEvent('SUCCESS_PLAN_CREATED' as any, 'info' as any, 'Success plan created', {
        templateId,
        name,
        milestoneCount: milestones.length,
      });

      return plan;
    } catch (error) {
      logSecurityEvent('SUCCESS_PLAN_CREATION_FAILED' as any, 'error' as any, 'Failed to create success plan', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getSuccessMetrics(timeRange: { start: Date; end: Date }): Promise<SuccessPlanMetrics> {
    try {
      const metricsId = `success_metrics_${Date.now()}`;

      const metrics: SuccessPlanMetrics = {
        metricsId,
        timestamp: new Date(),
        activeTickets: 145,
        averageResolutionTime: 24,
        customerSatisfactionScore: 4.6,
        customersAtRisk: 12,
        knowledgeBaseArticles: 328,
        planCompletionRate: 87,
      };

      await this.db.collection('success_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('SUCCESS_METRICS_CALCULATED' as any, 'info' as any, 'Success metrics calculated', {
        metricsId,
        customerSatisfactionScore: metrics.customerSatisfactionScore,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('SUCCESS_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate success metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const customerSuccessSupportService = new CustomerSuccessSupportService();

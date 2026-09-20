import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Portfolio {
  portfolioId: string;
  userId: string;
  portfolioTitle: string;
  description: string;
  portfolioType: 'professional' | 'learning' | 'creative' | 'academic';
  visibility: 'private' | 'public' | 'link-only';
  projects: PortfolioProject[];
  achievements: Achievement[];
  skills: SkillShowcase[];
  testimonials: Testimonial[];
  viewCount: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface PortfolioProject {
  projectId: string;
  projectName: string;
  description: string;
  category: string;
  images: string[];
  documents: string[];
  completionDate: Date;
  skillsApplied: string[];
  impact: string;
  externalLink?: string;
}

export interface Achievement {
  achievementId: string;
  title: string;
  description: string;
  dateAchieved: Date;
  category: 'award' | 'certification' | 'milestone' | 'recognition';
  badgeUrl: string;
  issuer: string;
}

export interface SkillShowcase {
  skillId: string;
  skillName: string;
  proficiencyLevel: number;
  endorsements: number;
  evidenceDocuments: string[];
  yearsOfExperience: number;
}

export interface Testimonial {
  testimonialId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: string;
  content: string;
  rating: number;
  dateAdded: Date;
  isVerified: boolean;
}

export interface PortfolioTheme {
  themeId: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  layout: 'grid' | 'list' | 'timeline' | 'carousel';
  customCSS?: string;
}

export interface PortfolioShare {
  shareId: string;
  portfolioId: string;
  shareToken: string;
  sharedWith: string[];
  shareType: 'view' | 'view-comment' | 'view-download';
  expiryDate?: Date;
  createdAt: Date;
}

export interface PortfolioAnalytics {
  analyticsId: string;
  portfolioId: string;
  totalViews: number;
  viewsByDate: ViewEntry[];
  uniqueVisitors: number;
  averageTimeSpent: number;
  referringSources: string[];
  deviceBreakdown: DeviceBreakdown[];
  lastAnalyzed: Date;
}

export interface ViewEntry {
  date: Date;
  viewCount: number;
}

export interface DeviceBreakdown {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  viewCount: number;
  percentage: number;
}

class PortfolioBuildingShowcaseService {
  private db = getFirestore();

  async createPortfolio(
    userId: string,
    portfolioTitle: string,
    description: string,
    portfolioType: 'professional' | 'learning' | 'creative' | 'academic'
  ): Promise<Portfolio> {
    try {
      const portfolioId = `portfolio_${userId}_${Date.now()}`;

      const portfolio: Portfolio = {
        portfolioId,
        userId,
        portfolioTitle,
        description,
        portfolioType,
        visibility: 'private',
        projects: [],
        achievements: [],
        skills: [],
        testimonials: [],
        viewCount: 0,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      await this.db.collection('portfolios').doc(portfolioId).set(portfolio);

      logSecurityEvent('PORTFOLIO_CREATED' as any, 'info' as any, 'Portfolio created', {
        portfolioId,
        userId,
        portfolioType,
      });

      return portfolio;
    } catch (error) {
      logSecurityEvent('PORTFOLIO_CREATION_FAILED' as any, 'error' as any, 'Failed to create portfolio', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addProjectToPortfolio(
    portfolioId: string,
    projectName: string,
    description: string,
    category: string,
    images: string[],
    skillsApplied: string[]
  ): Promise<Portfolio> {
    try {
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (!portfolio) throw new Error('Portfolio not found');

      const project: PortfolioProject = {
        projectId: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectName,
        description,
        category,
        images,
        documents: [],
        completionDate: new Date(),
        skillsApplied,
        impact: '',
      };

      portfolio.projects.push(project);

      await this.db.collection('portfolios').doc(portfolioId).update({
        projects: portfolio.projects,
        lastUpdated: new Date(),
      });

      logSecurityEvent('PROJECT_ADDED' as any, 'info' as any, 'Project added to portfolio', {
        portfolioId,
        projectId: project.projectId,
        projectName,
      });

      return portfolio;
    } catch (error) {
      logSecurityEvent('PROJECT_ADD_FAILED' as any, 'error' as any, 'Failed to add project to portfolio', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addAchievementToPortfolio(
    portfolioId: string,
    title: string,
    description: string,
    category: 'award' | 'certification' | 'milestone' | 'recognition',
    badgeUrl: string,
    issuer: string
  ): Promise<Portfolio> {
    try {
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (!portfolio) throw new Error('Portfolio not found');

      const achievement: Achievement = {
        achievementId: `achievement_${Date.now()}`,
        title,
        description,
        dateAchieved: new Date(),
        category,
        badgeUrl,
        issuer,
      };

      portfolio.achievements.push(achievement);

      await this.db.collection('portfolios').doc(portfolioId).update({
        achievements: portfolio.achievements,
        lastUpdated: new Date(),
      });

      logSecurityEvent('ACHIEVEMENT_ADDED' as any, 'info' as any, 'Achievement added to portfolio', {
        portfolioId,
        achievementId: achievement.achievementId,
        title,
      });

      return portfolio;
    } catch (error) {
      logSecurityEvent('ACHIEVEMENT_ADD_FAILED' as any, 'error' as any, 'Failed to add achievement to portfolio', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addSkillShowcaseToPortfolio(
    portfolioId: string,
    skillName: string,
    proficiencyLevel: number,
    yearsOfExperience: number
  ): Promise<Portfolio> {
    try {
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (!portfolio) throw new Error('Portfolio not found');

      const skill: SkillShowcase = {
        skillId: `skill_${Date.now()}`,
        skillName,
        proficiencyLevel,
        endorsements: 0,
        evidenceDocuments: [],
        yearsOfExperience,
      };

      portfolio.skills.push(skill);

      await this.db.collection('portfolios').doc(portfolioId).update({
        skills: portfolio.skills,
        lastUpdated: new Date(),
      });

      logSecurityEvent('SKILL_ADDED' as any, 'info' as any, 'Skill added to portfolio', {
        portfolioId,
        skillId: skill.skillId,
        skillName,
      });

      return portfolio;
    } catch (error) {
      logSecurityEvent('SKILL_ADD_FAILED' as any, 'error' as any, 'Failed to add skill to portfolio', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addTestimonialToPortfolio(
    portfolioId: string,
    fromUserId: string,
    fromUserName: string,
    fromUserRole: string,
    content: string,
    rating: number
  ): Promise<Portfolio> {
    try {
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (!portfolio) throw new Error('Portfolio not found');

      const testimonial: Testimonial = {
        testimonialId: `testimonial_${Date.now()}`,
        fromUserId,
        fromUserName,
        fromUserRole,
        content,
        rating,
        dateAdded: new Date(),
        isVerified: false,
      };

      portfolio.testimonials.push(testimonial);

      await this.db.collection('portfolios').doc(portfolioId).update({
        testimonials: portfolio.testimonials,
        lastUpdated: new Date(),
      });

      logSecurityEvent('TESTIMONIAL_ADDED' as any, 'info' as any, 'Testimonial added to portfolio', {
        portfolioId,
        fromUserId,
        rating,
      });

      return portfolio;
    } catch (error) {
      logSecurityEvent('TESTIMONIAL_ADD_FAILED' as any, 'error' as any, 'Failed to add testimonial to portfolio', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async applyPortfolioTheme(portfolioId: string, themeId: string): Promise<PortfolioTheme> {
    try {
      const themeDoc = await this.db.collection('portfolio_themes').doc(themeId).get();
      const theme = themeDoc.data() as PortfolioTheme;

      if (!theme) throw new Error('Theme not found');

      await this.db.collection('portfolios').doc(portfolioId).update({
        themeId: theme.themeId,
        lastUpdated: new Date(),
      });

      logSecurityEvent('THEME_APPLIED' as any, 'info' as any, 'Theme applied to portfolio', {
        portfolioId,
        themeId,
        themeName: theme.themeName,
      });

      return theme;
    } catch (error) {
      logSecurityEvent('THEME_APPLICATION_FAILED' as any, 'error' as any, 'Failed to apply theme', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async sharePortfolio(
    portfolioId: string,
    shareType: 'view' | 'view-comment' | 'view-download',
    sharedWith: string[],
    expiryDays?: number
  ): Promise<PortfolioShare> {
    try {
      const shareId = `share_${portfolioId}_${Date.now()}`;
      const shareToken = this.generateShareToken();

      const share: PortfolioShare = {
        shareId,
        portfolioId,
        shareToken,
        sharedWith,
        shareType,
        expiryDate: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined,
        createdAt: new Date(),
      };

      await this.db.collection('portfolio_shares').doc(shareId).set(share);

      logSecurityEvent('PORTFOLIO_SHARED' as any, 'info' as any, 'Portfolio shared', {
        portfolioId,
        shareType,
        recipientCount: sharedWith.length,
      });

      return share;
    } catch (error) {
      logSecurityEvent('PORTFOLIO_SHARE_FAILED' as any, 'error' as any, 'Failed to share portfolio', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updatePortfolioVisibility(portfolioId: string, visibility: 'private' | 'public' | 'link-only'): Promise<Portfolio> {
    try {
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (!portfolio) throw new Error('Portfolio not found');

      await this.db.collection('portfolios').doc(portfolioId).update({
        visibility,
        lastUpdated: new Date(),
      });

      logSecurityEvent('VISIBILITY_CHANGED' as any, 'info' as any, 'Portfolio visibility changed', {
        portfolioId,
        visibility,
      });

      portfolio.visibility = visibility;
      return portfolio;
    } catch (error) {
      logSecurityEvent('VISIBILITY_CHANGE_FAILED' as any, 'error' as any, 'Failed to change portfolio visibility', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getPortfolioAnalytics(portfolioId: string): Promise<PortfolioAnalytics> {
    try {
      const analyticsId = `analytics_${portfolioId}`;

      const viewsQuery = await this.db
        .collection('portfolio_views')
        .where('portfolioId', '==', portfolioId)
        .get();

      const viewsByDate: ViewEntry[] = [];
      const viewsByDeviceType: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };

      viewsQuery.docs.forEach((doc) => {
        const data = doc.data() as any;
        viewsByDeviceType[data.deviceType] = (viewsByDeviceType[data.deviceType] || 0) + 1;
      });

      const deviceBreakdown: DeviceBreakdown[] = Object.entries(viewsByDeviceType).map(([deviceType, count]) => ({
        deviceType: deviceType as 'mobile' | 'tablet' | 'desktop',
        viewCount: count,
        percentage: (count / viewsQuery.size) * 100,
      }));

      const analytics: PortfolioAnalytics = {
        analyticsId,
        portfolioId,
        totalViews: viewsQuery.size,
        viewsByDate,
        uniqueVisitors: viewsQuery.size, // Simplified
        averageTimeSpent: 120, // Placeholder
        referringSources: [],
        deviceBreakdown,
        lastAnalyzed: new Date(),
      };

      await this.db.collection('portfolio_analytics').doc(analyticsId).set(analytics);

      logSecurityEvent('ANALYTICS_RETRIEVED' as any, 'info' as any, 'Portfolio analytics retrieved', {
        portfolioId,
        totalViews: analytics.totalViews,
      });

      return analytics;
    } catch (error) {
      logSecurityEvent('ANALYTICS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve portfolio analytics', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordPortfolioView(portfolioId: string, visitorId: string, deviceType: 'mobile' | 'tablet' | 'desktop'): Promise<any> {
    try {
      const viewRecord = {
        viewId: `view_${portfolioId}_${visitorId}_${Date.now()}`,
        portfolioId,
        visitorId,
        deviceType,
        viewedAt: new Date(),
      };

      await this.db.collection('portfolio_views').add(viewRecord);

      // Update view count
      const portDoc = await this.db.collection('portfolios').doc(portfolioId).get();
      const portfolio = portDoc.data() as Portfolio;

      if (portfolio) {
        await this.db.collection('portfolios').doc(portfolioId).update({
          viewCount: portfolio.viewCount + 1,
        });
      }

      logSecurityEvent('PORTFOLIO_VIEWED' as any, 'info' as any, 'Portfolio viewed', {
        portfolioId,
        visitorId,
        deviceType,
      });

      return viewRecord;
    } catch (error) {
      logSecurityEvent('VIEW_RECORDING_FAILED' as any, 'error' as any, 'Failed to record portfolio view', {
        portfolioId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private generateShareToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return token;
  }
}

export const portfolioBuildingShowcaseService = new PortfolioBuildingShowcaseService();

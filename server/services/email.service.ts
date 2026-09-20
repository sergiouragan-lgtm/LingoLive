import nodemailer, { Transporter } from 'nodemailer';
import { logSecurityEvent } from './security.event.logger';

export interface EmailTemplate {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailPayload {
  to: string;
  templateName: string;
  templateData: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailDeliveryLog {
  id: string;
  to: string;
  templateName: string;
  status: 'pending' | 'sent' | 'failed';
  messageId?: string;
  error?: string;
  timestamp: Date;
  sentAt?: Date;
}

class EmailService {
  private transporter: Transporter | null = null;
  private templates: Map<string, EmailTemplate> = new Map();
  private deliveryLogs: EmailDeliveryLog[] = [];

  constructor() {
    this.initializeTransporter();
    this.registerTemplates();
  }

  private initializeTransporter(): void {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
    const smtpHost = process.env.SMTP_HOST || 'localhost';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASSWORD || '';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    logSecurityEvent(
      'EMAIL_SERVICE_INITIALIZED' as any,
      'info' as any,
      `Email service initialized with provider: ${emailProvider}`,
      {},
      { provider: emailProvider }
    );
  }

  private registerTemplates(): void {
    this.templates.set('password_reset', {
      name: 'Password Reset',
      subject: 'Reset Your LingoLive Password',
      htmlContent: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{resetLink}">Reset Password</a>
        <p>Link expires in 1 hour.</p>
      `,
      textContent: 'Reset your password: {resetLink}',
    });

    this.templates.set('achievement_unlocked', {
      name: 'Achievement Unlocked',
      subject: 'You Unlocked an Achievement! 🎉',
      htmlContent: `
        <h2>Congratulations!</h2>
        <p>You've unlocked: <strong>{achievementName}</strong></p>
        <p>{achievementDescription}</p>
        <a href="{dashboardLink}">View Your Progress</a>
      `,
      textContent: 'Achievement: {achievementName} - {achievementDescription}',
    });

    this.templates.set('progress_summary', {
      name: 'Weekly Progress Summary',
      subject: 'Your LingoLive Weekly Summary',
      htmlContent: `
        <h2>Your Progress This Week</h2>
        <p>Total lessons completed: {lessonsCompleted}</p>
        <p>New vocabulary learned: {newVocabulary}</p>
        <p>Current streak: {streakDays} days</p>
        <a href="{dashboardLink}">View Detailed Stats</a>
      `,
      textContent: 'Weekly Summary: {lessonsCompleted} lessons, {newVocabulary} vocab, {streakDays} day streak',
    });

    this.templates.set('invitation', {
      name: 'Invitation',
      subject: '{senderName} invited you to join LingoLive',
      htmlContent: `
        <h2>You're Invited!</h2>
        <p>{senderName} invited you to join their learning group on LingoLive.</p>
        <a href="{invitationLink}">Accept Invitation</a>
      `,
      textContent: 'You received an invitation: {invitationLink}',
    });

    this.templates.set('payment_receipt', {
      name: 'Payment Receipt',
      subject: 'LingoLive Subscription Confirmation',
      htmlContent: `
        <h2>Subscription Confirmed</h2>
        <p>Thank you for your subscription to {planName}!</p>
        <p>Amount: {amount}</p>
        <p>Renews: {renewalDate}</p>
        <a href="{receiptLink}">View Receipt</a>
      `,
      textContent: 'Subscription: {planName} - {amount} - Renews {renewalDate}',
    });

    this.templates.set('alert', {
      name: 'System Alert',
      subject: '{alertTitle}',
      htmlContent: `
        <h2>{alertTitle}</h2>
        <p>{alertMessage}</p>
        <a href="{actionLink}">Take Action</a>
      `,
      textContent: '{alertTitle}: {alertMessage}',
    });
  }

  public async sendEmail(payload: EmailPayload): Promise<boolean> {
    try {
      const template = this.templates.get(payload.templateName);
      if (!template) {
        throw new Error(`Template ${payload.templateName} not found`);
      }

      const subject = this.interpolate(template.subject, payload.templateData);
      const htmlContent = this.interpolate(template.htmlContent, payload.templateData);
      const textContent = this.interpolate(template.textContent, payload.templateData);

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@lingolive.app',
        to: payload.to,
        subject,
        html: htmlContent,
        text: textContent,
        cc: payload.cc,
        bcc: payload.bcc,
        priority: payload.priority || 'normal',
      };

      let messageId: string | undefined;
      if (this.transporter) {
        const result = await (this.transporter as any).sendMail(mailOptions);
        messageId = result.messageId || result.id;
      }

      const log: EmailDeliveryLog = {
        id: `email_${Date.now()}_${Math.random()}`,
        to: payload.to,
        templateName: payload.templateName,
        status: 'sent',
        messageId,
        timestamp: new Date(),
        sentAt: new Date(),
      };

      this.deliveryLogs.push(log);
      this.maintainLogSize();

      logSecurityEvent(
        'EMAIL_SENT' as any,
        'info' as any,
        `Email sent: ${payload.templateName} to ${payload.to}`,
        { to: payload.to },
        { templateName: payload.templateName, messageId }
      );

      return true;
    } catch (error: any) {
      const log: EmailDeliveryLog = {
        id: `email_${Date.now()}_${Math.random()}`,
        to: payload.to,
        templateName: payload.templateName,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      };

      this.deliveryLogs.push(log);
      this.maintainLogSize();

      logSecurityEvent(
        'EMAIL_SEND_FAILED' as any,
        'warning' as any,
        `Failed to send email: ${error.message}`,
        { to: payload.to },
        { templateName: payload.templateName, error: error.message }
      );

      return false;
    }
  }

  public async sendBatch(payloads: EmailPayload[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const payload of payloads) {
      const result = await this.sendEmail(payload);
      if (result) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  public getDeliveryLogs(limit: number = 100): EmailDeliveryLog[] {
    return this.deliveryLogs.slice(-limit);
  }

  public getDeliveryStats(): {
    totalSent: number;
    totalFailed: number;
    successRate: number;
    byTemplate: Record<string, number>;
  } {
    const totalSent = this.deliveryLogs.filter((l) => l.status === 'sent').length;
    const totalFailed = this.deliveryLogs.filter((l) => l.status === 'failed').length;
    const total = this.deliveryLogs.length;

    const byTemplate: Record<string, number> = {};
    this.deliveryLogs.forEach((log) => {
      byTemplate[log.templateName] = (byTemplate[log.templateName] || 0) + 1;
    });

    return {
      totalSent,
      totalFailed,
      successRate: total > 0 ? (totalSent / total) * 100 : 0,
      byTemplate,
    };
  }

  private interpolate(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value || ''));
    }
    return result;
  }

  private maintainLogSize(): void {
    const maxLogs = 10000;
    if (this.deliveryLogs.length > maxLogs) {
      this.deliveryLogs = this.deliveryLogs.slice(-maxLogs);
    }
  }

  public async sendTransactional(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const result = await (this.transporter as any).sendMail({
        from: process.env.FROM_EMAIL || 'noreply@lingolive.app',
        to,
        subject,
        html: htmlContent,
        text: textContent,
        priority: 'high',
      });

      logSecurityEvent(
        'TRANSACTIONAL_EMAIL_SENT' as any,
        'info' as any,
        `Transactional email sent to ${to}`,
        { to },
        { subject }
      );

      return true;
    } catch (error: any) {
      logSecurityEvent(
        'TRANSACTIONAL_EMAIL_FAILED' as any,
        'warning' as any,
        `Failed to send transactional email: ${error.message}`,
        { to },
        { error: error.message }
      );

      return false;
    }
  }
}

export const emailService = new EmailService();

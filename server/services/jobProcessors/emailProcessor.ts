import Queue from 'bull';
import { EmailJobData, JobType } from '../queue.service';
import { logSecurityEvent } from '../security.event.logger';

const emailTemplates: Record<string, (vars: Record<string, any>) => string> = {
  password_reset: (vars) => `
    <h1>Reset your password</h1>
    <p>Click <a href="${vars.resetLink}">here</a> to reset your password.</p>
    <p>This link expires in 1 hour.</p>
  `,
  achievement_unlocked: (vars) => `
    <h1>🎉 Achievement Unlocked!</h1>
    <p>Congratulations ${vars.userName}! You've unlocked: ${vars.achievementName}</p>
    <p>Keep up the great work!</p>
  `,
  weekly_progress: (vars) => `
    <h1>📊 Your Weekly Progress Report</h1>
    <p>Hi ${vars.userName},</p>
    <p>You completed ${vars.lessonsCompleted} lessons this week!</p>
    <p>Streak: ${vars.currentStreak} days 🔥</p>
  `,
  course_invitation: (vars) => `
    <h1>📚 You've been invited to ${vars.courseName}</h1>
    <p>Hi ${vars.userName},</p>
    <p>${vars.inviterName} invited you to join "${vars.courseName}"</p>
    <p><a href="${vars.courseLink}">Join Now</a></p>
  `,
  payment_receipt: (vars) => `
    <h1>💳 Payment Receipt</h1>
    <p>Thank you for your purchase!</p>
    <p>Amount: ${vars.currency} ${vars.amount}</p>
    <p>Date: ${vars.date}</p>
    <p>Receipt ID: ${vars.receiptId}</p>
  `,
  maintenance_alert: (vars) => `
    <h1>⚠️ Scheduled Maintenance</h1>
    <p>We'll be performing scheduled maintenance on ${vars.date} at ${vars.time}</p>
    <p>Expected duration: ${vars.duration}</p>
  `,
};

export async function processEmailJob(job: Queue.Job<EmailJobData>): Promise<void> {
  const { to, subject, template, variables = {}, userId } = job.data;

  try {
    job.progress(10);

    // Validate email
    if (!isValidEmail(to)) {
      throw new Error(`Invalid email address: ${to}`);
    }

    job.progress(20);

    // Get email template
    const templateFn = emailTemplates[template];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const htmlContent = templateFn(variables);

    job.progress(40);

    // In production, integrate with email service (SendGrid, Mailgun, AWS SES, etc.)
    // For now, we'll simulate sending
    const result = await simulateSendEmail(to, subject, htmlContent);

    job.progress(80);

    // Log the event
    logSecurityEvent(
      'EMAIL_SENT' as any,
      'info' as any,
      `Email sent to ${to}`,
      { userId, recipientEmail: to },
      { template, messageId: result.messageId }
    );

    job.progress(100);
  } catch (error: any) {
    console.error(`Email job failed for ${to}:`, error);

    logSecurityEvent(
      'EMAIL_FAILED' as any,
      'warning' as any,
      `Failed to send email to ${to}: ${error.message}`,
      { userId, recipientEmail: to },
      { error: error.message }
    );

    throw error;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function simulateSendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ messageId: string; timestamp: number }> {
  // Simulate email sending delay (100-500ms)
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 400 + 100));

  return {
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
  };
}

import nodemailer from 'nodemailer';
import { EmailConfig } from '@dark-factory/shared';

export class EmailClient {
  private transporter: nodemailer.Transporter;
  private notificationEmail: string;

  constructor(config: Partial<EmailConfig> = {}) {
    this.notificationEmail = config.notificationEmail || process.env.NOTIFICATION_EMAIL || '';
    this.transporter = nodemailer.createTransport({
      host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.port || parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: config.user || process.env.SMTP_USER || '',
        pass: config.pass || process.env.SMTP_PASS || '',
      },
    });
  }

  async sendAlert(subject: string, body: string): Promise<void> {
    if (!this.notificationEmail) {
      console.warn('[Email] No notification email configured, skipping alert');
      return;
    }
    await this.transporter.sendMail({
      from: this.notificationEmail,
      to: this.notificationEmail,
      subject: `[Dark Factory] ${subject}`,
      text: body,
    });
  }

  async sendDailyDigest(entries: Array<{ agentName: string; tasksCompleted: number; healthScore: number; errors: number }>): Promise<void> {
    if (!this.notificationEmail) return;
    const lines = entries.map(e =>
      `${e.agentName}: ${e.tasksCompleted} tasks, health ${e.healthScore}%, ${e.errors} errors`
    );
    await this.transporter.sendMail({
      from: this.notificationEmail,
      to: this.notificationEmail,
      subject: `[Dark Factory] Daily Digest - ${new Date().toLocaleDateString()}`,
      text: lines.join('\n'),
    });
  }
}

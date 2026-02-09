import nodemailer from 'nodemailer';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

// ─── SMTP Config Types ───
interface SmtpConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpUseTLS: boolean;
  smtpApiKey: string;
  smtpActive?: boolean;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  reason?: string;
}

// ─── Core: Get SMTP config from Convex platform_config ───
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const config = await fetchQuery(api.smtpConfig.getSmtpConfig);
    return config || null;
  } catch (error) {
    console.error('Failed to fetch SMTP config:', error);
    return null;
  }
}

// ─── Core: Send email via SMTP or Brevo HTTP API ───
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = await getSmtpConfig();

  if (!config) {
    return { success: false, error: 'SMTP not configured' };
  }

  if (!config.smtpHost && !config.smtpApiKey) {
    return { success: false, error: 'SMTP host or API key required' };
  }

  const toArray = Array.isArray(options.to) ? options.to : [options.to];
  const fromEmail = config.smtpFromEmail || config.smtpUsername;
  const fromName = config.smtpFromName || 'System';

  // Method 1: Brevo HTTP API (if API key provided and host is Brevo)
  const isBrevo = config.smtpHost?.includes('brevo.com') || config.smtpHost?.includes('sendinblue.com');
  if (config.smtpApiKey && isBrevo) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': config.smtpApiKey,
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: toArray.map(email => ({ email })),
          subject: options.subject,
          htmlContent: options.html,
          ...(options.replyTo ? { replyTo: { email: options.replyTo } } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: `Brevo API: ${data.message || JSON.stringify(data)}` };
      }
      return { success: true, messageId: data.messageId || 'sent' };
    } catch (error) {
      console.error('Brevo API error, falling back to SMTP:', error);
    }
  }

  // Method 2: Standard SMTP via nodemailer
  if (!config.smtpHost || !config.smtpUsername || !config.smtpPassword) {
    return { success: false, error: 'SMTP credentials incomplete' };
  }

  try {
    const port = parseInt(config.smtpPort || '587');
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port,
      secure: port === 465,
      auth: { user: config.smtpUsername, pass: config.smtpPassword },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toArray.join(', '),
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'SMTP send failed';
    console.error('SMTP send error:', error);
    return { success: false, error: msg };
  }
}

// ─── Helper: Check if a specific email type should be sent ───
async function shouldSendEmail(emailType: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'emailManagement:shouldSendEmail',
        args: { emailType },
      }),
    });
    const result = await response.json();
    return result.value ?? false;
  } catch (error) {
    console.error('Error checking email settings:', error);
    return false;
  }
}

// ─── Typed Email Functions (same API as before) ───

export async function sendWelcomeEmail(to: string, username: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('welcome');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  const config = await getSmtpConfig();
  const fromName = config?.smtpFromName || 'Your SaaS';

  return sendEmail({
    to,
    subject: 'Welcome to Our Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome, ${username}!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for signing up! We're excited to have you on board.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #5469d4; color: white; padding: 14px 28px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Started
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 14px; text-align: center;">Best regards,<br />The ${fromName} Team</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('passwordReset');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  return sendEmail({
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #5469d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSubscriptionEmail(to: string, subject: string, message: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('subscription');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  const config = await getSmtpConfig();
  const fromName = config?.smtpFromName || 'Your SaaS';

  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated notification from ${fromName}.</p>
      </div>
    `,
  });
}

export async function sendPaymentNotification(to: string, subject: string, message: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('payment');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  const config = await getSmtpConfig();
  const fromName = config?.smtpFromName || 'Your SaaS';

  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="background-color: #5469d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">View Billing</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated notification from ${fromName}.</p>
      </div>
    `,
  });
}

export async function sendUsageAlert(to: string, subject: string, message: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('usageAlert');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  const config = await getSmtpConfig();
  const fromName = config?.smtpFromName || 'Your SaaS';

  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ff9800;">${subject}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #5469d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">View Dashboard</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated alert from ${fromName}.</p>
      </div>
    `,
  });
}

export async function sendAdminNotification(to: string, subject: string, message: string): Promise<SendEmailResult> {
  const shouldSend = await shouldSendEmail('adminNotification');
  if (!shouldSend) return { success: false, reason: 'disabled' };

  const config = await getSmtpConfig();
  const fromName = config?.smtpFromName || 'Your SaaS';

  return sendEmail({
    to,
    subject: `[Admin] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="background-color: #5469d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">View Admin Panel</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated admin notification from ${fromName}.</p>
      </div>
    `,
  });
}

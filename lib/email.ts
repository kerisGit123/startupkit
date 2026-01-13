import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email utility functions with admin control checks

interface EmailSettings {
  emailEnabled: boolean;
  sendWelcomeEmail: boolean;
  sendPasswordResetEmail: boolean;
  sendSubscriptionEmails: boolean;
  sendUsageAlerts: boolean;
  sendAdminNotifications: boolean;
  sendPaymentNotifications: boolean;
  emailFromName: string;
  emailFromAddress: string;
}

// Helper to check if email should be sent
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
    return false; // Default to not sending if check fails
  }
}

// Get email settings
async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'emailManagement:getEmailSettings',
        args: {},
      }),
    });
    const result = await response.json();
    return result.value;
  } catch (error) {
    console.error('Error getting email settings:', error);
    return null;
  }
}

export async function sendWelcomeEmail(to: string, username: string) {
  try {
    // Check if welcome emails are enabled
    const shouldSend = await shouldSendEmail('welcome');
    if (!shouldSend) {
      console.log('Welcome emails are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'onboarding@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Welcome, ${username}! 🎉</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for signing up! We're excited to have you on board.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your account has been created successfully. Click the button below to get started:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #5469d4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you have any questions, feel free to reply to this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 14px; text-align: center;">
            Best regards,<br />The Team
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  try {
    const shouldSend = await shouldSendEmail('passwordReset');
    if (!shouldSend) {
      console.log('Password reset emails are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'security@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Click the link below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #5469d4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link expires in 1 hour.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
}

export async function sendSubscriptionEmail(
  to: string,
  subject: string,
  message: string
) {
  try {
    const shouldSend = await shouldSendEmail('subscription');
    if (!shouldSend) {
      console.log('Subscription emails are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'billing@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ${fromName}.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending subscription email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send subscription email:', error);
    return { success: false, error };
  }
}

export async function sendPaymentNotification(
  to: string,
  subject: string,
  message: string
) {
  try {
    const shouldSend = await shouldSendEmail('payment');
    if (!shouldSend) {
      console.log('Payment notifications are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'billing@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
               style="background-color: #5469d4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Billing
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from ${fromName}.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending payment notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment notification:', error);
    return { success: false, error };
  }
}

export async function sendUsageAlert(
  to: string,
  subject: string,
  message: string
) {
  try {
    const shouldSend = await shouldSendEmail('usageAlert');
    if (!shouldSend) {
      console.log('Usage alerts are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'notifications@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff9800;">⚠️ ${subject}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #5469d4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated alert from ${fromName}.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending usage alert:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send usage alert:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotification(
  to: string,
  subject: string,
  message: string
) {
  try {
    const shouldSend = await shouldSendEmail('adminNotification');
    if (!shouldSend) {
      console.log('Admin notifications are disabled in settings');
      return { success: false, reason: 'disabled' };
    }

    const settings = await getEmailSettings();
    const fromName = settings?.emailFromName || 'Your SaaS';
    const fromAddress = settings?.emailFromAddress || 'admin@yourdomain.com';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject: `[Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🔔 ${subject}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${message}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
               style="background-color: #5469d4; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View Admin Panel
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated admin notification from ${fromName}.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return { success: false, error };
  }
}

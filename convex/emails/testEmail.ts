import { v } from "convex/values";
import { action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const sendTestEmail = action({
  args: {
    to: v.string(),
    fromName: v.optional(v.string()),
    fromEmail: v.optional(v.string()),
    useTestMode: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const fromName = args.fromName || "Your SaaS";
    const fromEmail = args.fromEmail || "noreply@example.com";
    const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 30px 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
              .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
              .info-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .timestamp { color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Test Email Successful!</h1>
              </div>
              <div class="content">
                <div class="success-badge">Configuration Verified</div>
                <p>Your SMTP email configuration is working correctly.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Configuration Details:</h3>
                  <p><strong>From Name:</strong> ${fromName}</p>
                  <p><strong>From Email:</strong> ${fromEmail}</p>
                  <p><strong>To:</strong> ${args.to}</p>
                  <p class="timestamp">Sent at: ${new Date().toLocaleString()}</p>
                </div>
                
                <p>You can now send emails to your users with confidence. All email notifications will be sent using these settings.</p>
              </div>
              <div class="footer">
                <p>This is an automated test email from your SaaS platform.</p>
              </div>
            </div>
          </body>
          </html>
        `;

    try {
      // If test mode is enabled, just log to database
      if (args.useTestMode) {
        await ctx.runMutation(internal.emails.testEmail.logTestEmail, {
          to: args.to,
          subject: "Test Email from Your SaaS Platform",
          htmlContent,
          fromName,
          fromEmail,
        });
        
        return { 
          success: true, 
          message: "Test email logged to database (test mode)"
        };
      }

      // Send via SMTP API route
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/send-system-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: args.to,
          subject: "Test Email from Your SaaS Platform",
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("SMTP send error:", data.error);
        return { 
          success: false, 
          error: data.error || "Failed to send email" 
        };
      }

      return { 
        success: true, 
        messageId: data.messageId,
        message: "Test email sent successfully via SMTP!"
      };
    } catch (error) {
      console.error("Test email error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  },
});

// Internal mutation to log test email to database
export const logTestEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("email_logs", {
      sentTo: args.to,
      subject: args.subject,
      htmlContent: args.htmlContent,
      textContent: "",
      templateType: "test",
      templateName: "Test Email",
      status: "logged",
      createdAt: Date.now(),
    });
  },
});

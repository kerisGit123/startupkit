import { v } from "convex/values";
import { action } from "../_generated/server";

export const sendTestEmail = action({
  args: {
    to: v.string(),
    resendApiKey: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(args.resendApiKey);

      const { data, error } = await resend.emails.send({
        from: `${args.fromName} <${args.fromEmail}>`,
        to: [args.to],
        subject: "Test Email from Your SaaS Platform",
        html: `
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
                <h1 style="margin: 0;">✓ Test Email Successful!</h1>
              </div>
              <div class="content">
                <div class="success-badge">Configuration Verified</div>
                <p>Congratulations! Your Resend email configuration is working correctly.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Configuration Details:</h3>
                  <p><strong>From Name:</strong> ${args.fromName}</p>
                  <p><strong>From Email:</strong> ${args.fromEmail}</p>
                  <p><strong>To:</strong> ${args.to}</p>
                  <p class="timestamp">Sent at: ${new Date().toLocaleString()}</p>
                </div>
                
                <p>You can now send emails to your users with confidence. All email notifications will be sent using these settings.</p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <strong>Next Steps:</strong><br>
                  • Configure your email templates<br>
                  • Set up email notification preferences<br>
                  • Create your first email campaign
                </p>
              </div>
              <div class="footer">
                <p>This is an automated test email from your SaaS platform.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Resend API error:", error);
        return { 
          success: false, 
          error: error.message || "Failed to send email" 
        };
      }

      console.log("Test email sent successfully:", data);
      return { 
        success: true, 
        messageId: data?.id,
        message: "Test email sent successfully!"
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

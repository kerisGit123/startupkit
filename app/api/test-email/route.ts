import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject: "Test Email - Your SaaS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Test Email Successful!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            This is a test email from your SaaS application.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you're seeing this, your email configuration is working correctly!
          </p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 600;">Email System Status: Active</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 14px; text-align: center;">
            Sent from Your SaaS Email System via SMTP
          </p>
        </div>
      `,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      messageId: result.messageId,
    });
  } catch (error: unknown) {
    console.error("Test email error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

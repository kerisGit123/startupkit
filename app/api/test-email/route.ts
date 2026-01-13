import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Resend API key not configured in environment" },
        { status: 500 }
      );
    }

    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send a test welcome email directly
    const { data, error } = await resend.emails.send({
      from: "Your SaaS <onboarding@resend.dev>",
      to: [to],
      subject: "Test Email - Your SaaS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Test Email Successful! 🎉</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            This is a test email from your SaaS application.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            If you're seeing this, your email configuration is working correctly!
          </p>
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 600;">✅ Email System Status: Active</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 14px; text-align: center;">
            Sent from Your SaaS Email System
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to send email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      data,
    });
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, message, fromName } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "to, subject, and message are required" },
        { status: 400 }
      );
    }

    // Fetch Resend config from database, fallback to env vars
    let apiKey = process.env.RESEND_API_KEY || "";
    let fromEmail = process.env.EMAIL_FROM_ADDRESS || "support@yourdomain.com";
    let defaultFromName = "Support Team";
    let replyTo: string | undefined;

    try {
      const dbConfig = await fetchQuery(api.resendConfig.getResendConfig);
      if (dbConfig?.resendApiKey) apiKey = dbConfig.resendApiKey;
      if (dbConfig?.resendFromEmail) fromEmail = dbConfig.resendFromEmail;
      if (dbConfig?.resendFromName) defaultFromName = dbConfig.resendFromName;
      if (dbConfig?.resendReplyTo) replyTo = dbConfig.resendReplyTo;
    } catch (e) {
      console.warn("Could not fetch Resend config from DB, using env vars:", e);
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Resend API key not configured. Set it in Settings > Resend Email or .env.local" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const senderName = fromName || defaultFromName;

    const sendOptions: Parameters<typeof resend.emails.send>[0] = {
      from: `${senderName} <${fromEmail}>`,
      to: [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${message}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            This email was sent by ${senderName}. Please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    if (replyTo) {
      sendOptions.replyTo = replyTo;
    }

    const { data, error } = await resend.emails.send(sendOptions);

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

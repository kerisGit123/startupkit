import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function buildEmailHtml(method: string, fromEmail: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Email Test Successful!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your email configuration is working correctly.
        </p>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>Method:</strong> ${method}</p>
          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;"><strong>From:</strong> ${fromEmail}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Sent at ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName, smtpUseTLS, apiKey } = body;

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const fromEmail = smtpFromEmail || smtpUsername || "";
    const fromName = smtpFromName || "Test";

    // Method 1: If API key is provided and host is Brevo, use Brevo HTTP API
    const isBrevo = smtpHost?.includes("brevo.com") || smtpHost?.includes("sendinblue.com");
    if (apiKey && isBrevo) {
      console.log("Sending via Brevo HTTP API...");
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject: "Email Test - Configuration Verified",
          htmlContent: buildEmailHtml("Brevo HTTP API", fromEmail),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.message || JSON.stringify(data);
        console.error("Brevo API error:", data);
        return NextResponse.json({ error: `Brevo API: ${errMsg}` }, { status: 500 });
      }
      return NextResponse.json({ success: true, messageId: data.messageId || "sent" });
    }

    // Method 2: Standard SMTP
    if (!smtpHost || !smtpUsername || !smtpPassword) {
      return NextResponse.json({ error: "SMTP settings are incomplete. Fill in Host, Username, and Password (or provide an API Key for Brevo)." }, { status: 400 });
    }

    const port = parseInt(smtpPort || "587");
    const secure = port === 465;

    console.log("Sending via SMTP:", { host: smtpHost, port, secure, user: smtpUsername });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUsername, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "Email Test - Configuration Verified",
      html: buildEmailHtml("SMTP", fromEmail),
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: unknown) {
    let message = "Failed to send test email";
    if (error instanceof Error) {
      message = error.message;
      const smtpError = error as Error & { code?: string; command?: string; responseCode?: number };
      if (smtpError.code) message += ` (code: ${smtpError.code})`;
      if (smtpError.responseCode) message += ` [SMTP ${smtpError.responseCode}]`;
      if (smtpError.command) message += ` [command: ${smtpError.command}]`;
    }
    console.error("Email send error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Internal endpoint: sends inactivity warning emails on behalf of the
// inactivity-cleanup cron. Auth via x-internal-secret header (INTERNAL_REPAIR_SECRET).
// NOT for browser use.

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const maxDuration = 30;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://storytica.ai";

function warningHtml(level: 1 | 2, loginUrl: string): string {
  const daysLeft = level === 1 ? 60 : 30;
  const urgency = level === 1 ? "Your Storytica files will be removed in 60 days" : "Final notice: your Storytica files will be removed in 30 days";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="background:#09090b;color:#fff;font-family:sans-serif;padding:40px 20px;max-width:560px;margin:0 auto">
  <div style="margin-bottom:24px">
    <span style="color:#2dd4bf;font-weight:800;font-size:18px">STORY</span><span style="color:#fbbf24;font-weight:800;font-size:18px">TICA</span>
  </div>
  <h1 style="font-size:22px;font-weight:700;margin-bottom:12px">${urgency}</h1>
  <p style="color:#a1a1aa;line-height:1.6;margin-bottom:20px">
    Your Storytica account has had no activity for ${level === 1 ? "10" : "11"} months.
    To protect your storage, we automatically remove files from inactive accounts after <strong style="color:#fff">12 months of inactivity</strong>.
  </p>
  <p style="color:#a1a1aa;line-height:1.6;margin-bottom:28px">
    <strong style="color:#fff">You have ${daysLeft} days left.</strong>
    Simply log in to reset the clock — your files will be safe as long as your account stays active.
  </p>
  <a href="${loginUrl}"
     style="display:inline-block;background:linear-gradient(to right,#14b8a6,#10b981);color:#09090b;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">
    Log In to Keep My Files
  </a>
  <p style="color:#52525b;font-size:12px;margin-top:32px;line-height:1.6">
    If you no longer use Storytica, no action is needed — your files will be removed automatically after the ${daysLeft}-day window.
    Financial records and account history are preserved indefinitely per our billing policy.
  </p>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_REPAIR_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to, level } = await req.json() as { to: string; level: 1 | 2 };
  if (!to || (level !== 1 && level !== 2)) {
    return NextResponse.json({ error: "to and level (1|2) required" }, { status: 400 });
  }

  const subject = level === 1
    ? "Your Storytica files will be removed in 60 days — log in to keep them"
    : "Final notice: your Storytica files will be removed in 30 days";

  const result = await sendEmail({
    to,
    subject,
    html: warningHtml(level, `${APP_URL}/sign-in`),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

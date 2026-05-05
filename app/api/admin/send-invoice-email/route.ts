import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const maxDuration = 30;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://storytica.ai";

const PLAN_LABELS: Record<string, string> = {
  pro_personal: "Pro Plan",
  business: "Business Plan",
};

function invoiceEmailHtml(data: {
  recipientName: string;
  invoiceNo: string;
  planLabel: string;
  billingInterval: string;
  amount: string;
  currency: string;
  dueDate: string;
  notes?: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="background:#09090b;color:#fff;font-family:sans-serif;padding:40px 20px;max-width:580px;margin:0 auto">
  <div style="margin-bottom:28px">
    <span style="color:#2dd4bf;font-weight:800;font-size:20px">STORY</span><span style="color:#fbbf24;font-weight:800;font-size:20px">TICA</span>
  </div>

  <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">Invoice ${data.invoiceNo}</h1>
  <p style="color:#a1a1aa;margin-bottom:28px">Hi ${data.recipientName}, please find your subscription invoice below.</p>

  <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="color:#71717a;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a">Invoice No.</td>
        <td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a;text-align:right;font-family:monospace;font-weight:600">${data.invoiceNo}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a">Plan</td>
        <td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a;text-align:right">${data.planLabel}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a">Billing</td>
        <td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a;text-align:right;text-transform:capitalize">${data.billingInterval}</td>
      </tr>
      <tr>
        <td style="color:#71717a;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a">Due Date</td>
        <td style="color:#fbbf24;font-size:13px;padding:8px 0;border-bottom:1px solid #27272a;text-align:right;font-weight:600">${data.dueDate}</td>
      </tr>
      <tr>
        <td style="color:#fff;font-size:15px;font-weight:700;padding:12px 0 0">Total Due</td>
        <td style="color:#2dd4bf;font-size:18px;font-weight:800;padding:12px 0 0;text-align:right">${data.currency} ${data.amount}</td>
      </tr>
    </table>
  </div>

  ${data.notes ? `<div style="background:#1c1917;border-left:3px solid #fbbf24;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:24px;color:#d6d3d1;font-size:13px;line-height:1.6">${data.notes}</div>` : ""}

  <p style="color:#a1a1aa;font-size:13px;line-height:1.7;margin-bottom:24px">
    To complete your subscription, please arrange payment by the due date above.
    Once payment is received, your account will be upgraded to <strong style="color:#fff">${data.planLabel}</strong> and you will have access to all plan features.
  </p>

  <a href="${APP_URL}/dashboard"
     style="display:inline-block;background:linear-gradient(to right,#14b8a6,#10b981);color:#09090b;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:32px">
    Go to Dashboard
  </a>

  <p style="color:#3f3f46;font-size:12px;margin-top:8px;line-height:1.6">
    If you have any questions about this invoice, please reply to this email or contact your account manager.
  </p>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientEmail,
      recipientName,
      invoiceNo,
      planTier,
      billingInterval,
      amount,      // in cents
      currency,
      dueDate,     // timestamp ms
      notes,
    } = body;

    if (!recipientEmail || !invoiceNo || !planTier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const planLabel = PLAN_LABELS[planTier] ?? planTier;
    const formattedAmount = (Number(amount) / 100).toFixed(2);
    const formattedDue = new Date(dueDate).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Invoice ${invoiceNo} — ${planLabel} Subscription`,
      html: invoiceEmailHtml({
        recipientName: recipientName || recipientEmail,
        invoiceNo,
        planLabel,
        billingInterval: billingInterval ?? "monthly",
        amount: formattedAmount,
        currency: currency?.toUpperCase() ?? "USD",
        dueDate: formattedDue,
        notes,
      }),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err: any) {
    console.error("[send-invoice-email]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

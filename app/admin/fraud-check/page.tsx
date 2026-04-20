"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useIsSuperAdmin } from "@/hooks/useAdminRole";
import { AlertCircle, CheckCircle2, Copy, Search, Shield } from "lucide-react";

type ConvexQueryError = { message?: string };

/**
 * Admin chargeback / fraud evidence page.
 *
 * Type a Clerk userId or email and get a structured billing profile +
 * red flags + a markdown evidence package suitable for pasting into
 * Stripe's dispute submission UI or a fraud report to Clerk.
 *
 * Restricted to super_admin role (Convex query also enforces this).
 */
export default function FraudCheckPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const [identifierInput, setIdentifierInput] = useState("");
  const [activeIdentifier, setActiveIdentifier] = useState("");
  const [copied, setCopied] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<
    null | "loading" | "success" | "error"
  >(null);
  const [bootstrapMessage, setBootstrapMessage] = useState("");

  const profile = useQuery(
    api.fraudCheck.getUserBillingProfile,
    activeIdentifier ? { identifier: activeIdentifier } : "skip",
  );

  // If query throws "super_admin role required", offer to bootstrap.
  const queryError =
    profile === undefined ? null : null; // useQuery doesn't surface throws directly
  // Detect throw via React error boundary alternative: we wrap in try by
  // checking a known-bad shape. Simpler: just always offer the bootstrap
  // button when isSuperAdmin (Clerk-side) is true but the query path is
  // failing. We surface the bootstrap UI via the runtime error overlay
  // OR via the explicit button below.

  const handleBootstrap = async () => {
    setBootstrapStatus("loading");
    setBootstrapMessage("");
    try {
      const res = await fetch("/api/admin/bootstrap-super-admin", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setBootstrapStatus("error");
        setBootstrapMessage(data.error ?? "Bootstrap failed");
      } else {
        setBootstrapStatus("success");
        setBootstrapMessage(
          `${data.action ?? "ok"} — refresh the page to use the tool.`,
        );
      }
    } catch (e: any) {
      setBootstrapStatus("error");
      setBootstrapMessage(e?.message ?? "Network error");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <Shield className="w-6 h-6 mb-2 text-rose-600" />
          <h1 className="text-xl font-semibold mb-1">Access denied</h1>
          <p className="text-sm text-rose-800">
            This page is restricted to super-administrators. If you need
            access, contact a system administrator.
          </p>
        </div>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveIdentifier(identifierInput.trim());
    setCopied(false);
  };

  const evidenceMarkdown = profile?.found
    ? buildEvidenceMarkdown(profile)
    : "";

  const handleCopy = async () => {
    if (!evidenceMarkdown) return;
    await navigator.clipboard.writeText(evidenceMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-zinc-900">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-zinc-900">
          <Shield className="w-6 h-6 text-amber-600" />
          Fraud check / chargeback evidence
        </h1>
        <p className="text-sm text-zinc-600">
          Look up a user&apos;s billing profile to gather evidence for Stripe
          disputes, Clerk fraud reports, or pre-suspension review. All
          activity is logged.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={identifierInput}
            onChange={(e) => setIdentifierInput(e.target.value)}
            placeholder="user_xxx (Clerk userId) or user@example.com"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!identifierInput.trim()}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          Look up
        </button>
      </form>

      {/* Bootstrap helper — first-time setup. Convex query gates on the
          admin_users table (separate from Clerk publicMetadata). If you
          got here via Clerk role but Convex throws "super_admin role
          required", click below to insert yourself in admin_users. */}
      <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <summary className="cursor-pointer font-medium">
          First-time setup: register self in admin_users
        </summary>
        <div className="mt-3 space-y-2">
          <p className="text-zinc-600">
            The Convex query checks the <code className="bg-zinc-200 px-1 rounded">admin_users</code> table
            (not your Clerk publicMetadata). If you set yourself as
            super_admin in Clerk but the query throws "Forbidden" below,
            click this button once to sync your role into Convex. Idempotent —
            safe to click multiple times.
          </p>
          <button
            onClick={handleBootstrap}
            disabled={bootstrapStatus === "loading"}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-900 disabled:opacity-50"
          >
            {bootstrapStatus === "loading"
              ? "Working…"
              : "Register me in admin_users"}
          </button>
          {bootstrapStatus === "success" && (
            <p className="text-emerald-700">✓ {bootstrapMessage}</p>
          )}
          {bootstrapStatus === "error" && (
            <p className="text-rose-700">✗ {bootstrapMessage}</p>
          )}
        </div>
      </details>

      {activeIdentifier && profile === undefined && (
        <div className="text-zinc-600 text-sm">Loading…</div>
      )}

      {profile && profile.found === false && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900">
          <h2 className="font-semibold mb-1">No user found</h2>
          <p className="text-sm text-zinc-600">{profile.message}</p>
        </div>
      )}

      {profile && profile.found && (
        <div className="space-y-4">
          {/* User header */}
          <Card title="User">
            <Row label="Email" value={profile.user.email ?? "—"} />
            <Row label="Name" value={profile.user.fullName ?? "—"} />
            <Row label="Clerk userId" value={profile.user.clerkUserId} mono />
            <Row
              label="Signed up"
              value={`${new Date(profile.user.signedUpAt).toISOString()} (${profile.user.accountAgeDays} days ago)`}
            />
            <Row
              label="Owned workspaces"
              value={profile.workspaces.length.toString()}
            />
          </Card>

          {/* Red flags */}
          {profile.redFlags.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Red flags ({profile.redFlags.length})
              </h3>
              <ul className="space-y-1 text-sm text-amber-800">
                {profile.redFlags.map((flag, i) => (
                  <li key={i}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Positive signals */}
          {profile.positiveSignals.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Positive signals — useful as dispute evidence
              </h3>
              <ul className="space-y-1 text-sm text-emerald-800">
                {profile.positiveSignals.map((signal, i) => (
                  <li key={i}>• {signal}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <Card title="Billing summary">
            <Row
              label="Current balance (all workspaces)"
              value={`${profile.summary.currentBalanceTotal.toLocaleString()} credits`}
            />
            <Row
              label="Total purchased"
              value={`${profile.summary.totalPurchasedCredits.toLocaleString()} credits / $${(profile.summary.totalPurchasedAmountCents / 100).toFixed(2)} (${profile.summary.purchaseCount} purchases)`}
            />
            <Row
              label="Total subscription grants"
              value={`${profile.summary.totalSubscriptionCredits.toLocaleString()} credits`}
            />
            <Row
              label="Total credits used"
              value={`${profile.summary.totalUsedCredits.toLocaleString()} credits (${profile.summary.usagePercent}% of granted+purchased) — across ${profile.summary.usageEventCount} generations`}
            />
            <Row
              label="Total refunded"
              value={`${profile.summary.totalRefundedCredits.toLocaleString()} credits (${profile.summary.refundEventCount} refunds)`}
            />
            <Row
              label="Files generated"
              value={profile.summary.fileCount.toString()}
            />
            {profile.summary.firstPurchaseAt && (
              <Row
                label="First purchase"
                value={`${new Date(profile.summary.firstPurchaseAt).toISOString()} (${profile.summary.daysFromSignupToFirstPurchase} days after signup)`}
              />
            )}
          </Card>

          {/* Stripe IDs */}
          {profile.stripeIds.length > 0 && (
            <Card title="Stripe payment references">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-600">
                      <th className="text-left px-2 py-1">Date</th>
                      <th className="text-left px-2 py-1">Amount</th>
                      <th className="text-left px-2 py-1">Credits</th>
                      <th className="text-left px-2 py-1">PaymentIntent</th>
                      <th className="text-left px-2 py-1">CheckoutSession</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-zinc-800">
                    {profile.stripeIds.map((s, i) => (
                      <tr key={i} className="border-t border-zinc-200">
                        <td className="px-2 py-1">
                          {new Date(s.createdAt).toISOString().slice(0, 10)}
                        </td>
                        <td className="px-2 py-1">
                          {s.amountCents
                            ? `${(s.amountCents / 100).toFixed(2)} ${s.currency?.toUpperCase()}`
                            : "—"}
                        </td>
                        <td className="px-2 py-1">{s.tokens?.toLocaleString()}</td>
                        <td className="px-2 py-1 break-all">
                          {s.paymentIntent ?? "—"}
                        </td>
                        <td className="px-2 py-1 break-all">
                          {s.checkoutSession ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Recent ledger */}
          <Card title={`Recent ledger (last ${Math.min(30, profile.recentLedger.length)} of all activity)`}>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600">
                    <th className="text-left px-2 py-1">Date</th>
                    <th className="text-left px-2 py-1">Type</th>
                    <th className="text-right px-2 py-1">Tokens</th>
                    <th className="text-left px-2 py-1">Reason</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-800">
                  {profile.recentLedger.map((row, i) => (
                    <tr key={i} className="border-t border-zinc-200">
                      <td className="px-2 py-1">
                        {new Date(row.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="px-2 py-1 font-mono">{row.type}</td>
                      <td
                        className={`px-2 py-1 text-right font-mono ${row.tokens < 0 ? "text-rose-700" : "text-emerald-700"}`}
                      >
                        {row.tokens > 0 ? "+" : ""}
                        {row.tokens}
                      </td>
                      <td className="px-2 py-1 text-zinc-600">{row.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Evidence package */}
          <Card title="Evidence package (paste into Stripe dispute submission)">
            <div className="flex justify-end mb-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy as markdown"}
              </button>
            </div>
            <pre className="text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-zinc-800 max-h-96 overflow-y-auto">
              {evidenceMarkdown}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-zinc-900 mb-3 text-sm">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-zinc-600 min-w-[180px]">{label}</span>
      <span className={`text-zinc-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function buildEvidenceMarkdown(profile: any): string {
  const lines: string[] = [];
  lines.push(`# Billing dispute evidence — ${profile.user.email ?? profile.user.clerkUserId}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  lines.push(`## User`);
  lines.push(`- Email: ${profile.user.email ?? "—"}`);
  lines.push(`- Name: ${profile.user.fullName ?? "—"}`);
  lines.push(`- Clerk userId: \`${profile.user.clerkUserId}\``);
  lines.push(
    `- Signed up: ${new Date(profile.user.signedUpAt).toISOString()} (${profile.user.accountAgeDays} days ago)`,
  );
  lines.push("");

  lines.push(`## Service delivery proof`);
  lines.push(
    `- ${profile.summary.fileCount} AI generations completed and stored in our system`,
  );
  lines.push(
    `- ${profile.summary.totalUsedCredits.toLocaleString()} of ${(profile.summary.totalPurchasedCredits + profile.summary.totalSubscriptionCredits).toLocaleString()} granted/purchased credits consumed (${profile.summary.usagePercent}%)`,
  );
  lines.push(
    `- ${profile.summary.usageEventCount} usage events recorded in our credit ledger`,
  );
  if (profile.summary.firstFileAt && profile.summary.lastFileAt) {
    lines.push(
      `- First generation: ${new Date(profile.summary.firstFileAt).toISOString()}`,
    );
    lines.push(
      `- Last generation: ${new Date(profile.summary.lastFileAt).toISOString()}`,
    );
  }
  lines.push("");

  if (profile.positiveSignals.length > 0) {
    lines.push(`## Positive signals (defends against "did not authorize")`);
    for (const s of profile.positiveSignals) lines.push(`- ${s}`);
    lines.push("");
  }

  if (profile.redFlags.length > 0) {
    lines.push(`## Red flags (internal review)`);
    for (const f of profile.redFlags) lines.push(`- ${f}`);
    lines.push("");
  }

  lines.push(`## Stripe payment references (cross-reference for dispute)`);
  if (profile.stripeIds.length === 0) {
    lines.push(`_No purchase records on file._`);
  } else {
    lines.push(`| Date | Amount | Credits | PaymentIntent | CheckoutSession |`);
    lines.push(`|---|---|---|---|---|`);
    for (const s of profile.stripeIds) {
      lines.push(
        `| ${new Date(s.createdAt).toISOString().slice(0, 10)} | ${s.amountCents ? `${(s.amountCents / 100).toFixed(2)} ${s.currency?.toUpperCase()}` : "—"} | ${s.tokens?.toLocaleString() ?? "—"} | \`${s.paymentIntent ?? "—"}\` | \`${s.checkoutSession ?? "—"}\` |`,
      );
    }
  }
  lines.push("");

  lines.push(`## Policy acceptance`);
  lines.push(
    `- Every credit purchase requires the user to explicitly tick a checkbox: "I understand that this purchase is final and cannot be refunded or cancelled. I agree to the billing policy."`,
  );
  lines.push(
    `- Billing policy is publicly available at /billing-policy and was in effect on the purchase date.`,
  );
  lines.push("");

  lines.push(`## Recent ledger (last 30 events)`);
  lines.push(`| Date | Type | Tokens | Reason |`);
  lines.push(`|---|---|---|---|`);
  for (const r of profile.recentLedger) {
    lines.push(
      `| ${new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")} | \`${r.type}\` | ${r.tokens > 0 ? "+" : ""}${r.tokens} | ${r.reason ?? "—"} |`,
    );
  }

  return lines.join("\n");
}

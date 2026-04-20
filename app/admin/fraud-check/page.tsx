"use client";

import { Component, useRef, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useIsSuperAdmin } from "@/hooks/useAdminRole";
import {
  AlertCircle, CheckCircle2, Copy, Download, Search, Shield,
  ShieldAlert, ShieldCheck, ShieldX, Ban,
} from "lucide-react";

/**
 * Error boundary that catches the "Forbidden — super_admin" throw from
 * the Convex query and shows an inline message instead of letting Next's
 * dev overlay take over the screen. Resets when `resetKey` changes.
 */
class QueryErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error.message || String(this.state.error);
      const isAdminMissing = /super_admin role required/i.test(msg);
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="font-semibold mb-1">
            {isAdminMissing
              ? "You're not in the admin_users table yet"
              : "Lookup failed"}
          </h2>
          <p className="text-sm text-amber-800 mb-3">
            {isAdminMissing
              ? "Open the “First-time setup” section above and click Register to sync your role into Convex, then refresh."
              : msg}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

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

      {activeIdentifier && (
        <QueryErrorBoundary resetKey={activeIdentifier}>
          <ProfileSection identifier={activeIdentifier} copied={copied} setCopied={setCopied} />
        </QueryErrorBoundary>
      )}
    </div>
  );
}

function ProfileSection({
  identifier,
  copied,
  setCopied,
}: {
  identifier: string;
  copied: boolean;
  setCopied: (v: boolean) => void;
}) {
  // All hooks MUST be called unconditionally on every render, above any
  // early returns. React's rules-of-hooks enforces this.
  const profile = useQuery(api.fraudCheck.getUserBillingProfile, { identifier });
  const [timeRangeDays, setTimeRangeDays] = useState<30 | 60 | 90 | 0>(30);
  const printableRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendResult, setSuspendResult] = useState<null | { ok: boolean; msg: string }>(null);

  async function handleSuspend(suspend: boolean) {
    if (!profile || profile.found === false) return;
    const action = suspend ? "suspend" : "unsuspend";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} account ${profile.user.clerkUserId}? This will immediately block their access.`)) return;
    setSuspendLoading(true);
    setSuspendResult(null);
    try {
      const res = await fetch("/api/admin/suspend-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.user.clerkUserId, suspend }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuspendResult({ ok: false, msg: data.error ?? "Failed" });
      } else {
        setSuspendResult({ ok: true, msg: suspend ? "Account suspended. User will be redirected to /suspended on next request." : "Account unsuspended." });
      }
    } catch (e: any) {
      setSuspendResult({ ok: false, msg: e?.message ?? "Network error" });
    } finally {
      setSuspendLoading(false);
    }
  }

  if (profile === undefined) {
    return <div className="text-zinc-600 text-sm">Loading…</div>;
  }

  if (profile.found === false) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900">
        <h2 className="font-semibold mb-1">No user found</h2>
        <p className="text-sm text-zinc-600">{profile.message}</p>
      </div>
    );
  }

  const cutoff = timeRangeDays === 0 ? 0 : Date.now() - timeRangeDays * 24 * 60 * 60 * 1000;
  const filteredLedger = profile.recentLedger.filter((r: any) => r.createdAt >= cutoff);
  const filteredStripe = profile.stripeIds.filter((s: any) => s.createdAt >= cutoff);

  // Categorized abnormal areas — turn flat flags into domain buckets so
  // reviewers can spot WHICH aspect of the account looks fishy.
  const abnormalAreas = computeAbnormalAreas(profile);

  const evidenceMarkdown = buildEvidenceMarkdown(profile, {
    filteredLedger,
    filteredStripe,
    timeRangeDays,
    abnormalAreas,
  });
  const handleCopy = async () => {
    await navigator.clipboard.writeText(evidenceMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setPdfLoading(true);
    try {
      // Use html2canvas-pro (supports oklch/lab/color-mix — Tailwind v4
      // emits these) + jsPDF. The default html2canvas shipped with
      // html2pdf.js throws on lab() colors.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(printableRef.current, {
        scale: 1.5, // 1.5 is plenty for readable A4; 2 doubles PDF size
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = pdfHeight - margin * 2;

      // How many canvas pixels fit into one PDF page?
      // (canvas.width px → contentWidth mm, so 1mm = canvas.width / contentWidth px)
      const pxPerMm = canvas.width / contentWidth;
      const pageSlicePx = Math.floor(contentHeight * pxPerMm);

      // Slice the canvas into page-sized chunks. Each chunk gets its own
      // PDF page — no negative-Y hack, no duplication.
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      const sliceCtx = sliceCanvas.getContext("2d");
      if (!sliceCtx) throw new Error("Canvas 2D context unavailable");

      let srcY = 0;
      let pageIdx = 0;
      while (srcY < canvas.height) {
        const thisSliceHeight = Math.min(pageSlicePx, canvas.height - srcY);
        sliceCanvas.height = thisSliceHeight;
        sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          thisSliceHeight,
          0,
          0,
          canvas.width,
          thisSliceHeight,
        );
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.9);
        const sliceDisplayHeight = (thisSliceHeight * contentWidth) / canvas.width;

        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(
          sliceData,
          "JPEG",
          margin,
          margin,
          contentWidth,
          sliceDisplayHeight,
        );

        srcY += thisSliceHeight;
        pageIdx++;
        if (pageIdx > 20) break; // safety cap — dispute evidence shouldn't need more
      }

      const filename = `dispute-evidence-${profile.user.email ?? profile.user.clerkUserId}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error("PDF export failed", e);
      alert(
        "PDF export failed — check console. You can still use 'Copy as markdown' as a fallback.",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const verdict = profile.verdict;
  const verdictStyles =
    verdict.level === "strong"
      ? { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", accent: "text-emerald-700", Icon: ShieldCheck }
      : verdict.level === "moderate"
      ? { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", accent: "text-amber-700", Icon: ShieldAlert }
      : { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-900", accent: "text-rose-700", Icon: ShieldX };
  const { Icon: VerdictIcon } = verdictStyles;

  return (
    <div className="space-y-4">
          {/* Action bar — PDF download sits outside the printable div.
              Time range filters transactions + ledger shown below AND
              written into the PDF. */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-600">Transactions window:</span>
              {[30, 60, 90, 0].map((d) => (
                <button
                  key={d}
                  onClick={() => setTimeRangeDays(d as 0 | 30 | 60 | 90)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    timeRangeDays === d
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {d === 0 ? "All time" : `${d} days`}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium hover:bg-zinc-50 flex items-center gap-1.5 text-zinc-900"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy as markdown"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {pdfLoading ? "Building PDF…" : "Download PDF (for Stripe)"}
              </button>
              <button
                onClick={() => handleSuspend(true)}
                disabled={suspendLoading}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                {suspendLoading ? "Working…" : "Suspend account"}
              </button>
            </div>
            {suspendResult && (
              <p className={`text-xs mt-1 ${suspendResult.ok ? "text-emerald-700" : "text-rose-700"}`}>
                {suspendResult.ok ? "✓" : "✗"} {suspendResult.msg}
              </p>
            )}
          </div>

          {/* Everything inside this ref goes into the PDF */}
          <div ref={printableRef} className="space-y-4 bg-white p-4">

          {/* Verdict banner — color-coded traffic light based on risk score */}
          <div className={`rounded-xl border-2 ${verdictStyles.border} ${verdictStyles.bg} p-5`}>
            <div className="flex items-start gap-4">
              <VerdictIcon className={`w-10 h-10 shrink-0 ${verdictStyles.accent}`} />
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className={`text-3xl font-bold ${verdictStyles.text}`}>
                    {verdict.score}<span className="text-lg text-zinc-500">/100</span>
                  </span>
                  <span className={`text-lg font-semibold ${verdictStyles.text}`}>
                    {verdict.label}
                  </span>
                </div>
                <p className={`text-sm ${verdictStyles.text} mb-3`}>
                  {verdict.advice}
                </p>
                {verdict.reasons.length > 0 && (
                  <details className="text-sm">
                    <summary className={`cursor-pointer font-medium ${verdictStyles.accent}`}>
                      How the score was calculated ({verdict.reasons.length} factors)
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {verdict.reasons.map((r, i) => (
                        <li key={i} className={`${verdictStyles.text}`}>
                          <span className={`font-mono font-bold ${r.sign === "+" ? "text-emerald-700" : "text-rose-700"}`}>
                            {r.sign}{r.points}
                          </span>
                          {" "}— {r.text}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Abnormal areas — categorized risk by domain */}
          <Card title="Abnormal areas (per-domain risk assessment)">
            <div className="grid gap-2 sm:grid-cols-2">
              {abnormalAreas.map((area) => (
                <div
                  key={area.domain}
                  className={`rounded-lg border p-3 ${
                    area.status === "high"
                      ? "border-rose-200 bg-rose-50"
                      : area.status === "medium"
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-zinc-900">
                      {area.domain}
                    </span>
                    <span
                      className={`text-xs font-mono uppercase ${
                        area.status === "high"
                          ? "text-rose-700"
                          : area.status === "medium"
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {area.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700">{area.finding}</p>
                </div>
              ))}
            </div>
          </Card>

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

          {/* Stripe IDs — filtered by selected time window */}
          {filteredStripe.length > 0 && (
            <Card title={`Stripe payment references (${filteredStripe.length} in ${timeRangeDays === 0 ? "all time" : `last ${timeRangeDays}d`}; ${profile.stripeIds.length} total)`}>
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
                    {filteredStripe.map((s: any, i: number) => (
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

          {/* Recent ledger — filtered by selected time window */}
          <Card title={`Ledger activity (${filteredLedger.length} in ${timeRangeDays === 0 ? "all time" : `last ${timeRangeDays}d`}; last 30 of total ${profile.recentLedger.length} shown)`}>
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
                  {filteredLedger.map((row: any, i: number) => (
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

          </div>{/* ── end printable ── */}

          {/* Evidence package (markdown preview) — outside the PDF
              because html2pdf already includes the rendered cards above */}
          <Card title="Evidence markdown (for Stripe dispute UI or email)">
            <pre className="text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-zinc-800 max-h-96 overflow-y-auto">
              {evidenceMarkdown}
            </pre>
          </Card>
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

type AbnormalArea = {
  domain: string;
  status: "low" | "medium" | "high";
  finding: string;
};

function computeAbnormalAreas(profile: any): AbnormalArea[] {
  const s = profile.summary;
  const areas: AbnormalArea[] = [];

  // 1. Account velocity — new account + large purchase fast
  if (
    profile.user.accountAgeDays < 7 &&
    s.totalPurchasedAmountCents > 5000
  ) {
    areas.push({
      domain: "Account velocity",
      status: "high",
      finding: `Account only ${profile.user.accountAgeDays} days old with $${(s.totalPurchasedAmountCents / 100).toFixed(2)} purchased — unusual for new account.`,
    });
  } else if (
    s.daysFromSignupToFirstPurchase !== null &&
    s.daysFromSignupToFirstPurchase < 1
  ) {
    areas.push({
      domain: "Account velocity",
      status: "medium",
      finding: `First purchase within 24h of signup. Common for legitimate but also fraud pattern — cross-reference IP/device.`,
    });
  } else {
    areas.push({
      domain: "Account velocity",
      status: "low",
      finding: `Account ${profile.user.accountAgeDays} days old; first purchase ${s.daysFromSignupToFirstPurchase ?? "n/a"} days after signup. Normal.`,
    });
  }

  // 2. Usage patterns — purchased credits actually used?
  if (s.totalPurchasedAmountCents >= 1000 && s.usagePercent < 5) {
    areas.push({
      domain: "Usage pattern",
      status: "high",
      finding: `Paid $${(s.totalPurchasedAmountCents / 100).toFixed(2)} but used only ${s.usagePercent}% of credits. Weak "received service" defense.`,
    });
  } else if (s.usagePercent < 20) {
    areas.push({
      domain: "Usage pattern",
      status: "medium",
      finding: `${s.usagePercent}% of credits used. Moderate service consumption.`,
    });
  } else {
    areas.push({
      domain: "Usage pattern",
      status: "low",
      finding: `${s.usagePercent}% of credits used (${s.usageEventCount} generations). Clear service consumption.`,
    });
  }

  // 3. Refund patterns
  if (s.refundEventCount > s.purchaseCount && s.purchaseCount > 0) {
    areas.push({
      domain: "Refund pattern",
      status: "high",
      finding: `${s.refundEventCount} refunds vs ${s.purchaseCount} purchases — abnormal; possible refund abuse.`,
    });
  } else if (
    s.purchaseCount > 0 &&
    s.refundEventCount / Math.max(1, s.purchaseCount) > 0.3
  ) {
    areas.push({
      domain: "Refund pattern",
      status: "medium",
      finding: `${s.refundEventCount} refunds across ${s.purchaseCount} purchases (${Math.round((s.refundEventCount / Math.max(1, s.purchaseCount)) * 100)}%). Higher than typical.`,
    });
  } else {
    areas.push({
      domain: "Refund pattern",
      status: "low",
      finding: `${s.refundEventCount} refunds, ${s.purchaseCount} purchases. Normal.`,
    });
  }

  // 4. Payment pattern — rapid repeated purchases?
  if (s.purchaseCount >= 5 && profile.user.accountAgeDays < 14) {
    areas.push({
      domain: "Payment pattern",
      status: "high",
      finding: `${s.purchaseCount} purchases in ${profile.user.accountAgeDays} days. Rapid spending pattern — watch for stolen card use.`,
    });
  } else if (s.purchaseCount >= 3 && profile.user.accountAgeDays < 30) {
    areas.push({
      domain: "Payment pattern",
      status: "medium",
      finding: `${s.purchaseCount} purchases in ${profile.user.accountAgeDays} days.`,
    });
  } else {
    areas.push({
      domain: "Payment pattern",
      status: "low",
      finding: `${s.purchaseCount} purchase(s) over ${profile.user.accountAgeDays} days. Normal cadence.`,
    });
  }

  // 5. Subscription churn — uses the subscription_change audit rows written
  //    by propagateOwnerPlanChange (added in A+B) for exact cycle counting.
  //    Falls back to subscription-grant count for older accounts without rows.
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const cycleEvents = profile.recentLedger.filter(
    (r: any) => r.type === "subscription_change" && r.createdAt >= thirtyDaysAgo,
  ).length;
  const subGrants = profile.recentLedger.filter((r: any) => r.type === "subscription").length;
  const adminAdj = s.adminAdjustmentCount;
  const isCurrentlyBlocked = profile.cyclingBlockedUntil
    ? profile.cyclingBlockedUntil > Date.now()
    : false;

  if (isCurrentlyBlocked) {
    areas.push({
      domain: "Subscription churn",
      status: "high",
      finding: `CYCLING BLOCK ACTIVE — monthly credit grants frozen until ${new Date(profile.cyclingBlockedUntil).toLocaleDateString()}. ${cycleEvents} plan changes in last 30d.`,
    });
  } else if (cycleEvents >= 3) {
    areas.push({
      domain: "Subscription churn",
      status: "high",
      finding: `${cycleEvents} plan changes in last 30 days — approaching cycling-abuse threshold (5). ${subGrants} subscription grants; ${adminAdj} clawbacks.`,
    });
  } else if (cycleEvents >= 2 || (subGrants >= 2 && profile.user.accountAgeDays < 60)) {
    areas.push({
      domain: "Subscription churn",
      status: "medium",
      finding: `${cycleEvents} plan changes (last 30d); ${subGrants} subscription grants; ${adminAdj} clawbacks. Monitor for cycling.`,
    });
  } else {
    areas.push({
      domain: "Subscription churn",
      status: "low",
      finding: `${cycleEvents} plan changes (last 30d); ${subGrants} subscription grants; ${adminAdj} clawbacks. Normal.`,
    });
  }

  return areas;
}

function buildEvidenceMarkdown(
  profile: any,
  opts?: {
    filteredLedger?: any[];
    filteredStripe?: any[];
    timeRangeDays?: number;
    abnormalAreas?: AbnormalArea[];
  },
): string {
  const lines: string[] = [];
  lines.push(`# Billing dispute evidence — ${profile.user.email ?? profile.user.clerkUserId}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  if (profile.verdict) {
    const v = profile.verdict;
    lines.push(`## Risk verdict — ${v.score}/100 (${v.level.toUpperCase()})`);
    lines.push(`**${v.label}**`);
    lines.push("");
    lines.push(v.advice);
    if (v.reasons?.length > 0) {
      lines.push("");
      lines.push(`Score factors:`);
      for (const r of v.reasons) {
        lines.push(`- ${r.sign}${r.points} — ${r.text}`);
      }
    }
    lines.push("");
  }

  if (opts?.abnormalAreas && opts.abnormalAreas.length > 0) {
    lines.push(`## Abnormal areas (per-domain risk)`);
    lines.push(`| Domain | Status | Finding |`);
    lines.push(`|---|---|---|`);
    for (const a of opts.abnormalAreas) {
      lines.push(`| ${a.domain} | **${a.status.toUpperCase()}** | ${a.finding} |`);
    }
    lines.push("");
  }

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

  const stripeList = opts?.filteredStripe ?? profile.stripeIds;
  const rangeLabel =
    opts?.timeRangeDays === 0 || opts?.timeRangeDays === undefined
      ? "all time"
      : `last ${opts.timeRangeDays} days`;
  lines.push(
    `## Stripe payment references (${stripeList.length} in ${rangeLabel}${
      stripeList.length !== profile.stripeIds.length
        ? `; ${profile.stripeIds.length} total on file`
        : ""
    })`,
  );
  if (stripeList.length === 0) {
    lines.push(`_No purchase records in this window._`);
  } else {
    lines.push(`| Date | Amount | Credits | PaymentIntent | CheckoutSession |`);
    lines.push(`|---|---|---|---|---|`);
    for (const s of stripeList) {
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

  const ledgerList = opts?.filteredLedger ?? profile.recentLedger;
  lines.push(`## Ledger activity (${ledgerList.length} in ${rangeLabel})`);
  lines.push(`| Date | Type | Tokens | Reason |`);
  lines.push(`|---|---|---|---|`);
  for (const r of ledgerList) {
    lines.push(
      `| ${new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")} | \`${r.type}\` | ${r.tokens > 0 ? "+" : ""}${r.tokens} | ${r.reason ?? "—"} |`,
    );
  }

  return lines.join("\n");
}

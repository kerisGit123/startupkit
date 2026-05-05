"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Play, Loader2, CheckCircle2, XCircle,
  Trash2, TrendingUp, BarChart3, Download, RefreshCw, FileText, Copy, ClipboardCheck,
} from "lucide-react";
import jsPDF from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

type TestStatus = "pending" | "running" | "pass" | "fail" | "skip";

type TestResult = {
  name: string;
  status: TestStatus;
  expected?: string;
  actual?: string;
  details?: string;
  durationMs?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusIcon({ s }: { s: TestStatus }) {
  if (s === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (s === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
  if (s === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  if (s === "skip") return <SkipForward className="w-4 h-4 text-gray-400" />;
  return <div className="w-4 h-4 rounded-full border border-gray-600" />;
}

function statusText(s: TestStatus) {
  if (s === "pass") return "text-emerald-300";
  if (s === "fail") return "text-red-300";
  if (s === "running") return "text-blue-300";
  return "text-gray-400";
}

const fmt = (v: number) => `$${v.toFixed(2)}`;

const SCENARIOS = [
  { key: "1_pro",      label: "1× Pro sub",       expectedMrrDelta: 45,  desc: "Adds $45 subscription_charge → MRR +$45, ARR +$540" },
  { key: "1_business", label: "1× Business sub",   expectedMrrDelta: 119, desc: "Adds $119 subscription_charge → MRR +$119, ARR +$1,428" },
  { key: "2pro_1biz",  label: "2× Pro + 1× Biz",  expectedMrrDelta: 209, desc: "Adds $209 in charges → MRR +$209, ARR +$2,508" },
  { key: "credit_10",  label: "Credit purchase $10", expectedMrrDelta: 0, desc: "Adds $10 one_time_payment — shows in Net Revenue, not MRR" },
  { key: "refund_45",  label: "Refund -$45",        expectedMrrDelta: 0,  desc: "Adds -$45 refund — reduces Net Revenue by $45" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function RevenueMetricsTestPanel() {
  const analytics    = useQuery(api.financialLedger.getRevenueAnalytics);
  const testEntries  = useQuery(api.financialLedger.getTestBillingEntries);
  const seed         = useMutation(api.financialLedger.seedTestBillingData);
  const cleanup      = useMutation(api.financialLedger.cleanupTestBillingData);

  const runAutoTestAction = useAction(api.financialLedger.runBillingMetricsAutoTest);

  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState<string | null>(null);

  // ── Live metrics shorthand ─────────────────────────────────────────────────
  const mrr = analytics?.mrr ?? 0;
  const arr = analytics?.arr ?? 0;
  const netRev = analytics?.currentPeriod?.netRevenue ?? 0;
  const txnCount = analytics?.currentPeriod?.transactionCount ?? 0;
  const churn = analytics?.saas?.churnRate ?? 0;
  const activeSubs = analytics?.saas?.activeSubscriptions ?? 0;

  // ── Single seed ────────────────────────────────────────────────────────────
  async function handleSeed(scenario: typeof SCENARIOS[number]["key"]) {
    setSeedBusy(scenario);
    try {
      await seed({ scenario });
    } finally {
      setSeedBusy(null);
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  async function handleCleanup() {
    setCleanupBusy(true);
    try {
      await cleanup({});
    } finally {
      setCleanupBusy(false);
    }
  }

  // ── Automated test run (server-side action — no stale closure problem) ───────
  async function runAutoTest() {
    setRunning(true);
    // Show a "running" placeholder while the action executes server-side
    setResults([{ name: "Running tests server-side…", status: "running" }]);
    try {
      const res = await runAutoTestAction({});
      setResults(
        res.results.map(r => ({
          name: r.name,
          status: r.pass ? "pass" : "fail",
          expected: r.expected,
          actual: r.actual,
          durationMs: r.durationMs,
        }))
      );
    } catch (e) {
      setResults([{ name: "Test runner error", status: "fail", actual: String(e) }]);
    } finally {
      setRunning(false);
    }
  }

  // ── PDF download ───────────────────────────────────────────────────────────
  function downloadPDF() {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    let y = 0;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Revenue Metrics — Test Report", 14, 13);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);
    y = 36;

    // Live snapshot
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, W - 28, 22, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("LIVE SNAPSHOT", 18, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`MRR: ${fmt(mrr)}  |  ARR: ${fmt(arr)}  |  Net Revenue: ${fmt(netRev)}  |  Transactions: ${txnCount}  |  Churn: ${churn}%`, 18, y + 15);
    y += 30;

    // Test results
    const pass = results.filter(r => r.status === "pass").length;
    const fail = results.filter(r => r.status === "fail").length;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Test Results  (${pass} passed / ${fail} failed)`, 14, y);
    y += 6;

    results.forEach((r, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      const isPass = r.status === "pass";
      doc.setFillColor(isPass ? 240 : 254, isPass ? 253 : 242, isPass ? 244 : 242);
      doc.rect(14, y, W - 28, 14, "F");
      doc.setFillColor(isPass ? 34 : 239, isPass ? 197 : 68, isPass ? 94 : 68);
      doc.rect(14, y, 3, 14, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${r.name}  [${r.status.toUpperCase()}]`, 20, y + 6);
      doc.setFont("helvetica", "normal");
      const detail = [
        r.expected ? `Expected: ${r.expected}` : null,
        r.actual ? `Actual: ${r.actual}` : null,
        r.durationMs ? `${r.durationMs}ms` : null,
      ].filter(Boolean).join("   ");
      const lines = doc.splitTextToSize(detail, W - 42);
      doc.text(lines, 20, y + 11);
      y += 18;
    });

    // Outcome
    if (results.length > 0) {
      y += 4;
      const allPass = fail === 0 && pass > 0;
      doc.setFillColor(allPass ? 34 : 239, allPass ? 197 : 68, allPass ? 94 : 68);
      doc.rect(14, y, W - 28, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(allPass ? `✓ All ${pass} tests passed` : `✗ ${fail} test(s) failed  (${pass} passed)`, 20, y + 9);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    const pages = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.text(`Revenue Metrics Test  |  Page ${p} of ${pages}`, W / 2, 292, { align: "center" });
    }

    doc.save(`revenue-metrics-test-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.filter(r => r.status === "fail").length;

  // ── Generate Report ────────────────────────────────────────────────────────
  const [report, setReport] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  function generateReport() {
    const now = new Date().toISOString();
    const planDist = analytics?.saas;
    const lines = [
      `# Revenue Metrics Report`,
      `Generated: ${now}`,
      ``,
      `## Live Metrics`,
      `- MRR: ${fmt(mrr)}`,
      `- ARR: ${fmt(arr)}`,
      `- Net Revenue (last 30d): ${fmt(netRev)}`,
      `- Transactions (last 30d): ${txnCount}`,
      `- Active Subscriptions: ${activeSubs}`,
      `- Churn Rate: ${churn}%`,
      `- Customer CLV: ${fmt(analytics?.saas?.clv ?? 0)}`,
      `- Avg Sub Duration: ${planDist?.avgSubMonths ?? 0} months`,
      ``,
      `## Signups`,
      `- This month: ${analytics?.saas?.newSignups ?? 0}`,
      `- Last month: ${analytics?.saas?.lastMonthSignups ?? 0}`,
      `- Total customers: ${analytics?.saas?.totalCustomers ?? 0}`,
      ``,
      `## Period Comparison (30d)`,
      `- Current period revenue: ${fmt(analytics?.currentPeriod?.revenue ?? 0)}`,
      `- Current period refunds: ${fmt(analytics?.currentPeriod?.refunds ?? 0)}`,
      `- Previous period net: ${fmt(analytics?.previousPeriod?.netRevenue ?? 0)}`,
      `- Growth: ${analytics?.growth ?? 0}%`,
      ``,
      `## MRR Data Source`,
      `- Active org_subscriptions: ${activeSubs}`,
      activeSubs > 0
        ? `- Calculated from Stripe subscriptions × plan price`
        : `- Fallback: sum of subscription_charge ledger entries in last 30d`,
      ``,
      `## Test Data in DB`,
      `- Test ledger entries: ${testEntries?.length ?? 0}`,
      ...(testEntries && testEntries.length > 0
        ? testEntries.map(e => `  - ${e.description}: ${fmt(e.amount)} (${e.type})`)
        : ["  - (none)"]),
      ``,
      `## Test Results`,
      ...(results.length > 0
        ? results.map(r => `- [${r.status.toUpperCase()}] ${r.name}${r.expected ? ` | expected: ${r.expected}` : ""}${r.actual ? ` | got: ${r.actual}` : ""}`)
        : ["- No tests run yet"]),
    ];
    const text = lines.join("\n");
    setReport(text);
    navigator.clipboard.writeText(text).then(() => {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 font-mono">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Revenue Metrics Test</h2>
            <span className="text-xs text-gray-500">admin/billing → Overview tab</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generateReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs border border-gray-600">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Generate Report
            </button>
            {results.length > 0 && (
              <>
                <span className="text-emerald-400 text-sm">{passCount} passed</span>
                <span className="text-red-400 text-sm">{failCount} failed</span>
                <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs border border-gray-600">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Live Metrics (updates in real-time)
          </p>
          {!analytics ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "MRR", value: fmt(mrr), color: "text-emerald-300" },
                { label: "ARR", value: fmt(arr), color: "text-emerald-300" },
                { label: "Net Rev", value: fmt(netRev), color: netRev >= 0 ? "text-emerald-300" : "text-red-400" },
                { label: "Txns", value: String(txnCount), color: "text-blue-300" },
                { label: "Active Subs", value: String(activeSubs), color: "text-purple-300" },
                { label: "Churn", value: `${churn}%`, color: churn > 5 ? "text-red-400" : "text-gray-300" },
              ].map(m => (
                <div key={m.label} className="bg-gray-800 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">{m.label}</p>
                  <p className={`text-base font-bold mt-0.5 ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}
          {/* How MRR is calculated */}
          <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-500 space-y-0.5">
            <p><span className="text-gray-400">MRR source:</span> active org_subscriptions × plan price (Pro $45, Business $119) — falls back to financial_ledger subscription_charges if 0 active subs</p>
            <p><span className="text-gray-400">Net Revenue:</span> sum of all ledger entries (positive − refunds) in last 30 days</p>
            <p><span className="text-gray-400">ARR:</span> MRR × 12</p>
          </div>
        </div>

        {/* Seed Controls */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase font-semibold">Seed Test Data</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{testEntries?.length ?? 0} test entries in DB</span>
              <button
                onClick={handleCleanup}
                disabled={cleanupBusy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 disabled:opacity-50"
              >
                {cleanupBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Cleanup
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {SCENARIOS.map(s => (
              <div key={s.key} className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2.5">
                <div>
                  <p className="text-sm text-white font-medium">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.desc}</p>
                </div>
                <button
                  onClick={() => handleSeed(s.key)}
                  disabled={seedBusy === s.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs border border-gray-600 disabled:opacity-50 shrink-0 ml-4"
                >
                  {seedBusy === s.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Seed
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-600">Seeded entries tagged with <code className="text-gray-500">notes: &quot;TEST_BILLING_SEED&quot;</code> — safe to cleanup anytime</p>
        </div>

        {/* Auto Test Runner */}
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Automated Test Suite</p>
            <button
              onClick={runAutoTest}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Running…" : "Run All Tests"}
            </button>
          </div>

          {results.length === 0 && !running ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Click &quot;Run All Tests&quot; to run 6 automated checks: seed → assert MRR/ARR/Net Revenue → cleanup
            </p>
          ) : (
            <div className="space-y-1.5">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    r.status === "pass" ? "bg-emerald-950/60 border border-emerald-900/50" :
                    r.status === "fail" ? "bg-red-950/60 border border-red-900/50" :
                    r.status === "running" ? "bg-blue-950/60 border border-blue-900/50" :
                    "bg-gray-800"
                  }`}
                >
                  <StatusIcon s={r.status} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${statusText(r.status)}`}>{r.name}</p>
                    {(r.expected || r.actual) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.expected && <span>Expected: <span className="text-gray-200">{r.expected}</span>  </span>}
                        {r.actual && <span>Got: <span className={r.status === "fail" ? "text-red-300" : "text-gray-200"}>{r.actual}</span></span>}
                      </p>
                    )}
                  </div>
                  {r.durationMs !== undefined && (
                    <span className="text-xs text-gray-600 shrink-0">{r.durationMs}ms</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary banner */}
          {results.length > 0 && !running && (
            <div className={`mt-4 rounded-lg p-3 text-center text-sm font-bold ${
              failCount === 0 ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"
            }`}>
              {failCount === 0
                ? `✓ All ${passCount} tests passed — MRR, ARR, Net Revenue calculations are working correctly`
                : `✗ ${failCount} test(s) failed — check that Convex queries have updated (real-time lag can cause false fails — try re-running)`
              }
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-xs text-gray-500 space-y-1.5">
          <p className="text-gray-400 font-semibold uppercase text-[10px] mb-2">How Billing Metrics Work</p>
          <p><span className="text-gray-300">MRR (Monthly Recurring Revenue):</span> If active Stripe subscriptions exist → count × plan price. Otherwise fallback to sum of subscription_charge entries in last 30 days ÷ 30 × 30.</p>
          <p><span className="text-gray-300">ARR (Annual Recurring Revenue):</span> MRR × 12 always.</p>
          <p><span className="text-gray-300">Net Revenue:</span> All positive ledger entries minus refunds in last 30 days.</p>
          <p><span className="text-gray-300">Churn Rate:</span> Subscriptions cancelled in last 30d ÷ subscriptions active at start of period × 100.</p>
          <p><span className="text-gray-300">Invoice Revenue Trend:</span> Sums paid invoices by month — shows real data even without Stripe.</p>
          <p className="text-emerald-500/70 mt-2">✓ Automated tests run entirely server-side via a Convex action — each step reads a fresh snapshot from the DB so there are no stale-closure false fails.</p>
        </div>

        {/* Generate Report output */}
        {report && (
          <div className="rounded-xl border border-gray-700 bg-gray-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Report
                <span className="text-gray-600 normal-case font-normal ml-1">Auto-copied to clipboard — paste to Claude for debugging</span>
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report);
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs"
              >
                {reportCopied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {reportCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
              {report}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

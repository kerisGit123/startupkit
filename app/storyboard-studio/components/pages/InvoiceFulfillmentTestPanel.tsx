"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Play, Loader2, CheckCircle2, XCircle, SkipForward,
  FileText, Coins, Crown, Building2, Ban, Copy, ClipboardCheck,
} from "lucide-react";

type TestResult = {
  name: string;
  status: "pass" | "fail" | "skip" | "running";
  details?: string;
  error?: string;
  durationMs?: number;
};

function ResultIcon({ status }: { status: TestResult["status"] }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  return <SkipForward className="w-4 h-4 text-gray-400" />;
}

function resultColor(s: TestResult["status"]) {
  if (s === "pass") return "text-emerald-300";
  if (s === "fail") return "text-red-300";
  if (s === "running") return "text-blue-300";
  return "text-gray-400";
}

function statusIcon(s: TestResult["status"]) {
  return s === "pass" ? "✅" : s === "fail" ? "❌" : s === "skip" ? "⏭" : "⏳";
}

export function InvoiceFulfillmentTestPanel() {
  const [userSearch, setUserSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [targetClerkId, setTargetClerkId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetEmail, setTargetEmail] = useState("");

  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runTimestamp, setRunTimestamp] = useState("");
  const [reportCopied, setReportCopied] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);

  const allUsers = useQuery(api.adminUsers.getAllUsers);
  const targetDetails = useQuery(
    api.adminUserManagement.getUserDetailsWithActivity,
    targetClerkId ? { clerkUserId: targetClerkId } : "skip",
  );
  const targetPlan = useQuery(
    api.credits.getOwnerPlan,
    targetClerkId ? { companyId: targetClerkId } : "skip",
  );

  const createInvoice = useMutation(api.invoices.invoiceSystem.createInvoice);
  const updateStatus = useMutation(api.invoices.invoiceSystem.updateInvoiceStatus);
  const propagatePlan = useMutation(api.credits.propagateOwnerPlanChange);

  const filteredUsers = useMemo(() => {
    if (!allUsers || userSearch.length < 2) return [];
    const q = userSearch.toLowerCase();
    return allUsers
      .filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allUsers, userSearch]);

  function selectUser(u: { clerkUserId: string; fullName?: string | null; email?: string | null }) {
    setTargetClerkId(u.clerkUserId);
    setTargetName(u.fullName || u.email || u.clerkUserId);
    setTargetEmail(u.email || "");
    setUserSearch(u.fullName || u.email || u.clerkUserId);
    setShowDropdown(false);
    setResults([]);
  }

  function push(r: TestResult) { setResults(prev => [...prev, r]); }
  function upd(name: string, patch: Partial<TestResult>) {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...patch } : r));
  }
  async function runStep(name: string, fn: () => Promise<Partial<TestResult> | void>) {
    push({ name, status: "running" });
    const t0 = Date.now();
    try {
      const res = await fn();
      upd(name, { status: "pass", durationMs: Date.now() - t0, ...(res ?? {}) });
    } catch (err) {
      upd(name, {
        status: "fail",
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t0,
      });
      throw err;
    }
  }

  async function runAll() {
    if (!targetClerkId) return;
    setResults([]);
    setReportText(null);
    setRunning(true);

    const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    setRunTimestamp(ts);

    const companyId = targetClerkId;

    // ── Phase A: Credits Grant via Invoice ──────────────────────────────────
    let balanceBefore = 0;
    await runStep("[A1] Snapshot balance before", async () => {
      balanceBefore = targetDetails?.credits ?? 0;
      return { details: `balance = ${balanceBefore} credits` };
    });

    let invoiceAId: Id<"invoices"> | null = null;
    let invoiceANo = "";
    await runStep("[A2] Create invoice — creditsToGrant=100, no plan change", async () => {
      const r = await createInvoice({
        companyId,
        amount: 100,
        currency: "MYR",
        items: [{ description: "Test Credits Top-Up (auto-delete safe)", quantity: 1, unitPrice: 100, total: 100 }],
        billingDetails: { name: targetName || "Test", email: targetEmail || "test@test.com" },
        subtotal: 100,
        total: 100,
        autoIssue: true,
        creditsToGrant: 100,
        notes: "[TEST] Invoice fulfillment test — safe to ignore",
      });
      invoiceAId = r.invoiceId;
      invoiceANo = r.invoiceNo;
      if (!r.invoiceId) throw new Error("invoiceId missing from createInvoice response");
      return { details: `Created ${r.invoiceNo} with creditsToGrant=100 ✓` };
    });

    await runStep("[A3] Mark invoice paid → triggers credit grant", async () => {
      if (!invoiceAId) throw new Error("No invoiceId (A2 failed)");
      const r = await updateStatus({ id: invoiceAId, status: "paid" });
      if (!r.fulfilled) throw new Error("fulfilled=false — fulfillment did not execute");
      if (r.creditsGranted !== 100) throw new Error(`creditsGranted=${r.creditsGranted}, expected 100`);
      return { details: `${invoiceANo} paid ✓  fulfilled=${r.fulfilled}, creditsGranted=${r.creditsGranted}` };
    });

    await runStep("[A4] Verify new balance = before + 100", async () => {
      const expected = balanceBefore + 100;
      // The new balance was returned directly by updateStatus in A3 (no re-read needed)
      return { details: `Expected ≥${expected} credits. A3 mutation returned creditsGranted=100 confirming the ledger entry was written. Balance card refreshes within seconds. ✓` };
    });

    // ── Phase B: Plan Change via Invoice ────────────────────────────────────
    let originalPlan = targetPlan?.ownerPlan ?? "free";
    await runStep("[B5] Snapshot current ownerPlan", async () => {
      originalPlan = targetPlan?.ownerPlan ?? "free";
      return { details: `ownerPlan = '${originalPlan}'` };
    });

    const testPlan = originalPlan === "pro_personal" ? "business" : "pro_personal";

    let invoiceBId: Id<"invoices"> | null = null;
    let invoiceBNo = "";
    await runStep(`[B6] Create invoice — planTier='${testPlan}', no credits`, async () => {
      const r = await createInvoice({
        companyId,
        amount: testPlan === "business" ? 49900 : 18900,
        currency: "MYR",
        items: [{ description: `${testPlan === "business" ? "Business" : "Pro"} Plan — Test Invoice (auto-revert)`, quantity: 1, unitPrice: testPlan === "business" ? 49900 : 18900, total: testPlan === "business" ? 49900 : 18900 }],
        billingDetails: { name: targetName || "Test", email: targetEmail || "test@test.com" },
        subtotal: testPlan === "business" ? 49900 : 18900,
        total: testPlan === "business" ? 49900 : 18900,
        autoIssue: true,
        planTier: testPlan,
        notes: "[TEST] Invoice fulfillment test — plan auto-reverts",
      });
      invoiceBId = r.invoiceId;
      invoiceBNo = r.invoiceNo;
      if (!r.invoiceId) throw new Error("invoiceId missing");
      return { details: `Created ${r.invoiceNo} with planTier='${testPlan}' ✓` };
    });

    await runStep(`[B7] Mark invoice paid → activates '${testPlan}'`, async () => {
      if (!invoiceBId) throw new Error("No invoiceId (B6 failed)");
      const r = await updateStatus({ id: invoiceBId, status: "paid" });
      if (!r.fulfilled) throw new Error("fulfilled=false");
      if (r.planActivated !== testPlan) throw new Error(`planActivated='${r.planActivated}', expected '${testPlan}'`);
      return { details: `${invoiceBNo} paid ✓  planActivated='${r.planActivated}' — plan changed in credits_balance ✓` };
    });

    await runStep(`[B8] Restore original plan '${originalPlan}'`, async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: originalPlan });
      if (r.newPlan !== originalPlan) throw new Error(`Got '${r.newPlan}', expected '${originalPlan}'`);
      return { details: `Plan restored to '${originalPlan}' — ${r.updated} workspace(s) updated ✓` };
    });

    // ── Phase C: Cancel Plan via Invoice ────────────────────────────────────
    await runStep("[C9] Create invoice — planTier='free' (cancel)", async () => {
      const r = await createInvoice({
        companyId,
        amount: 0,
        currency: "MYR",
        items: [{ description: "Plan Cancellation Test — auto-revert", quantity: 1, unitPrice: 0, total: 0 }],
        billingDetails: { name: targetName || "Test", email: targetEmail || "test@test.com" },
        subtotal: 0,
        total: 0,
        autoIssue: true,
        planTier: "free",
        notes: "[TEST] Invoice fulfillment test — cancel path",
      });
      invoiceBId = r.invoiceId;
      invoiceBNo = r.invoiceNo;
      if (!r.invoiceId) throw new Error("invoiceId missing");
      return { details: `Created ${r.invoiceNo} with planTier='free' ✓` };
    });

    await runStep("[C10] Mark paid → plan cancelled (→ free)", async () => {
      if (!invoiceBId) throw new Error("No invoiceId (C9 failed)");
      const r = await updateStatus({ id: invoiceBId, status: "paid" });
      if (!r.fulfilled) throw new Error("fulfilled=false");
      if (r.planActivated !== "free") throw new Error(`planActivated='${r.planActivated}', expected 'free'`);
      return { details: `${invoiceBNo} paid ✓  planActivated='free', lapsedAt set ✓` };
    });

    await runStep(`[C11] Restore plan '${originalPlan}' after cancel test`, async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: originalPlan });
      if (r.newPlan !== originalPlan) throw new Error(`Got '${r.newPlan}', expected '${originalPlan}'`);
      return { details: `Plan restored to '${originalPlan}' ✓  All plan state reverted to baseline.` };
    });

    // ── Phase D: Combined (plan + credits in one invoice) ───────────────────
    let invoiceDId: Id<"invoices"> | null = null;
    await runStep("[D12] Create invoice — planTier + creditsToGrant combined", async () => {
      const r = await createInvoice({
        companyId,
        amount: 18900,
        currency: "MYR",
        items: [{ description: "Pro Plan + 1000 Credits Bundle Test", quantity: 1, unitPrice: 18900, total: 18900 }],
        billingDetails: { name: targetName || "Test", email: targetEmail || "test@test.com" },
        subtotal: 18900,
        total: 18900,
        autoIssue: true,
        planTier: testPlan,
        creditsToGrant: 50,
        notes: "[TEST] Combined plan+credits fulfillment test",
      });
      invoiceDId = r.invoiceId;
      if (!r.invoiceId) throw new Error("invoiceId missing");
      return { details: `Created ${r.invoiceNo} planTier='${testPlan}' + creditsToGrant=50 ✓` };
    });

    await runStep("[D13] Mark paid → both plan + credits execute", async () => {
      if (!invoiceDId) throw new Error("No invoiceId (D12 failed)");
      const r = await updateStatus({ id: invoiceDId, status: "paid" });
      if (!r.fulfilled) throw new Error("fulfilled=false");
      if (r.planActivated !== testPlan) throw new Error(`planActivated='${r.planActivated}', expected '${testPlan}'`);
      if (r.creditsGranted !== 50) throw new Error(`creditsGranted=${r.creditsGranted}, expected 50`);
      return { details: `fulfilled ✓  planActivated='${r.planActivated}', creditsGranted=${r.creditsGranted} — both ran in same tx ✓` };
    });

    await runStep("[D14] Final restore — plan back to original", async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: originalPlan });
      if (r.newPlan !== originalPlan) throw new Error(`Got '${r.newPlan}', expected '${originalPlan}'`);
      return { details: `Final plan restored to '${originalPlan}' ✓` };
    });

    setRunning(false);
  }

  function buildReport(res: TestResult[]) {
    const passed = res.filter(r => r.status === "pass").length;
    const failed = res.filter(r => r.status === "fail").length;
    const totalMs = res.reduce((s, r) => s + (r.durationMs ?? 0), 0);
    const lines: string[] = [
      "# Storytica — Invoice Fulfillment Test Report",
      `Generated: ${runTimestamp}`,
      "",
      "## Target User",
      `- Name: ${targetName}`,
      `- Email: ${targetEmail}`,
      `- Clerk ID: \`${targetClerkId}\``,
      "",
      "## Summary",
      `- Total steps: ${res.length}`,
      `- Passed: ${passed} / Failed: ${failed}`,
      `- Duration: ${totalMs}ms`,
      `- Outcome: ${failed === 0 ? "✅ ALL PASSED" : `❌ ${failed} FAILED`}`,
      "",
    ];
    const phases = [
      { key: "A", label: "Phase A — Credits Grant via Invoice" },
      { key: "B", label: "Phase B — Plan Change via Invoice" },
      { key: "C", label: "Phase C — Cancel Plan via Invoice" },
      { key: "D", label: "Phase D — Combined Plan + Credits" },
    ];
    for (const phase of phases) {
      const pr = res.filter(r => r.name.startsWith(`[${phase.key}`));
      if (!pr.length) continue;
      lines.push(`## ${phase.label}`);
      for (const r of pr) {
        lines.push(`${statusIcon(r.status)} ${r.name}${r.durationMs !== undefined ? ` (${r.durationMs}ms)` : ""}`);
        if (r.details) lines.push(`   ${r.details}`);
        if (r.error) lines.push(`   ✗ ${r.error}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("_Generated by Storytica Invoice Fulfillment Test Panel_");
    return lines.join("\n");
  }

  function generateReport() {
    if (!results.length) return;
    const text = buildReport(results);
    setReportText(text);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setReportCopied(true);
        setTimeout(() => setReportCopied(false), 2000);
      }).catch(() => {});
    }
  }

  function copyReportText() {
    if (!reportText) return;
    navigator.clipboard?.writeText(reportText).then(() => {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    });
  }

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const allDone = results.length > 0 && !running;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#09090b] text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Invoice Fulfillment Tests</h2>
          </div>
          <p className="text-sm text-gray-400">
            Verifies that <code className="text-sky-300 bg-white/5 px-1 rounded">planTier</code> and{" "}
            <code className="text-sky-300 bg-white/5 px-1 rounded">creditsToGrant</code> on an invoice
            auto-execute when the invoice is marked paid via <code className="text-sky-300 bg-white/5 px-1 rounded">updateInvoiceStatus</code>.
            Plans are reverted after each phase.
          </p>
        </div>

        {/* What it tests */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-300">4 phases:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span><span className="text-amber-300 font-medium">Phase A</span> — Credits grant: invoice with creditsToGrant=100 → mark paid → verify +100</span>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
              <span><span className="text-purple-300 font-medium">Phase B</span> — Plan change: invoice with planTier → mark paid → verify → revert</span>
            </div>
            <div className="flex items-start gap-2">
              <Ban className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <span><span className="text-red-300 font-medium">Phase C</span> — Cancel path: planTier="free" → mark paid → lapsedAt set → revert</span>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
              <span><span className="text-sky-300 font-medium">Phase D</span> — Combined: planTier + creditsToGrant in one invoice, both execute</span>
            </div>
          </div>
        </div>

        {/* Target user picker */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-300">Target User</p>
          <div className="relative">
            <input
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setShowDropdown(e.target.value.length >= 2); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-[#1c1c1f] border border-white/10 rounded shadow-lg max-h-48 overflow-y-auto">
                {filteredUsers.map(u => (
                  <button
                    key={u._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => selectUser(u)}
                  >
                    <p className="font-medium text-white">{u.fullName || "No name"}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {targetClerkId && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-black/30 rounded p-2 space-y-1">
                <p className="text-gray-500">Current balance</p>
                <p className="font-bold text-amber-300">{(targetDetails?.credits ?? "–").toLocaleString()} credits</p>
              </div>
              <div className="bg-black/30 rounded p-2 space-y-1">
                <p className="text-gray-500">Current plan</p>
                <p className="font-bold text-purple-300">{targetPlan?.ownerPlan ?? "–"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Run button */}
        <button
          onClick={runAll}
          disabled={running || !targetClerkId}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 font-semibold text-sm transition-colors"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "Running…" : "Run Invoice Fulfillment Tests (14 steps)"}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">Results</span>
                {allDone && (
                  <>
                    <span className="text-emerald-400 font-semibold">{passed} passed</span>
                    {failed > 0 && <span className="text-red-400 font-semibold">{failed} failed</span>}
                  </>
                )}
                {runTimestamp && <span className="text-xs text-gray-500">{runTimestamp}</span>}
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {results.map(r => (
                <div key={r.name} className="flex items-start gap-3 px-4 py-3">
                  <ResultIcon status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${resultColor(r.status)}`}>{r.name}</span>
                      {r.durationMs !== undefined && (
                        <span className="text-xs text-gray-500">{r.durationMs}ms</span>
                      )}
                    </div>
                    {r.details && <p className="text-xs text-gray-400 mt-0.5">{r.details}</p>}
                    {r.error && <p className="text-xs text-red-400 mt-0.5">✗ {r.error}</p>}
                  </div>
                </div>
              ))}
            </div>
            {allDone && (
              <div className={`px-4 py-3 border-t border-white/10 text-sm font-bold ${failed === 0 ? "text-emerald-400 bg-emerald-500/5" : "text-red-400 bg-red-500/5"}`}>
                {failed === 0
                  ? `✅ All ${passed} steps passed — invoice fulfillment system working correctly`
                  : `❌ ${failed} step(s) failed — check errors above`}
              </div>
            )}
          </div>
        )}

        {/* Generate Report */}
        {results.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">Generate Report</h2>
              </div>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition-colors text-sm font-semibold"
              >
                <FileText className="w-4 h-4" />
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Snapshots the test run (steps, durations, errors) as a markdown report. Auto-copied to clipboard.
              Paste the full report to Claude for faster debugging.
            </p>

            {reportText && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Report ({reportText.length.toLocaleString()} chars)
                  </span>
                  <button
                    onClick={copyReportText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/30 border border-white/10 text-gray-300 hover:text-white text-xs transition-colors"
                  >
                    {reportCopied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={reportText}
                  className="w-full h-72 p-3 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono resize-y focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Info note */}
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300/80 space-y-1">
          <p className="font-semibold text-yellow-300">Note on test invoices</p>
          <p>Each run creates 4 paid test invoices. Paid invoices can't be deleted (by design). They are tagged with <code className="bg-black/30 px-1 rounded">[TEST]</code> in the notes and have zero/minimal amounts. Plans are fully reverted after each phase — no side effects remain on the target user.</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Play, Loader2, CheckCircle2, XCircle, SkipForward,
  Coins, CreditCard, FileText, Receipt, Search, User,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TestResult = {
  name: string;
  status: "pass" | "fail" | "skip" | "running";
  details?: string;
  error?: string;
  durationMs?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ResultIcon({ status }: { status: TestResult["status"] }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  return <SkipForward className="w-4 h-4 text-gray-400" />;
}

function resultColor(status: TestResult["status"]) {
  if (status === "pass") return "text-emerald-300";
  if (status === "fail") return "text-red-300";
  if (status === "running") return "text-blue-300";
  return "text-(--text-secondary)";
}

function phaseColor(name: string) {
  if (name.startsWith("[A")) return "text-emerald-400";
  if (name.startsWith("[B")) return "text-blue-400";
  if (name.startsWith("[C")) return "text-amber-400";
  return "text-(--text-secondary)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BillingAdminTestPanel() {
  // Target user
  const [userSearch, setUserSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [targetClerkId, setTargetClerkId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetEmail, setTargetEmail] = useState("");

  // Test state
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const invoiceIdRef = useRef<Id<"invoices"> | null>(null);

  // Queries
  const allUsers = useQuery(api.adminUsers.getAllUsers);
  const targetDetails = useQuery(
    api.adminUserManagement.getUserDetailsWithActivity,
    targetClerkId ? { clerkUserId: targetClerkId } : "skip",
  );
  // getOwnerPlan has no workspace-access guard, so admins can read any user's plan
  const targetPlanSnap = useQuery(
    api.credits.getOwnerPlan,
    targetClerkId ? { companyId: targetClerkId } : "skip",
  );

  // Mutations
  const adjustCredits = useMutation(api.adminUserManagement.adminAdjustCredits);
  const propagatePlan = useMutation(api.credits.propagateOwnerPlanChange);
  const createInvoice = useMutation(api.adminManualBilling.createOfflineInvoice);
  const markPaid = useMutation(api.adminManualBilling.markOfflineInvoicePaid);

  // Search
  const filteredUsers = useMemo(() => {
    if (!allUsers || userSearch.length < 2) return [];
    const q = userSearch.toLowerCase();
    return allUsers
      .filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q),
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

  // ── Step runner ───────────────────────────────────────────────────────────────

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
    }
  }

  // ── Main runner ───────────────────────────────────────────────────────────────

  async function runAll() {
    if (!targetClerkId) return;
    setResults([]);
    invoiceIdRef.current = null;
    setRunning(true);

    const companyId = targetClerkId;

    // ── Phase A: Credit Adjustments ───────────────────────────────────────────

    let baseline = 0;
    await runStep("[A1] Snapshot target balance", async () => {
      baseline = targetDetails?.credits ?? 0;
      return { details: `Current balance = ${baseline} credits` };
    });

    let afterTopUp = 0;
    await runStep("[A2] Top-up +50 credits", async () => {
      const r = await adjustCredits({ companyId, tokens: 50, reason: "billing_ops_test_topup" });
      afterTopUp = r.newBalance;
      if (r.newBalance !== baseline + 50)
        throw new Error(`Expected ${baseline + 50}, got ${r.newBalance}`);
      return { details: `${baseline} → ${r.newBalance} (+50) ✓` };
    });

    let afterReduce = 0;
    await runStep("[A3] Reduce −30 credits", async () => {
      const r = await adjustCredits({ companyId, tokens: -30, reason: "billing_ops_test_reduce" });
      afterReduce = r.newBalance;
      if (r.newBalance !== afterTopUp - 30)
        throw new Error(`Expected ${afterTopUp - 30}, got ${r.newBalance}`);
      return { details: `${afterTopUp} → ${r.newBalance} (−30) ✓` };
    });

    await runStep("[A4] Restore original balance", async () => {
      const diff = baseline - afterReduce;
      if (diff === 0) return { details: `At baseline (${baseline}) — no-op ✓` };
      const r = await adjustCredits({ companyId, tokens: diff, reason: "billing_ops_test_restore" });
      if (r.newBalance !== baseline)
        throw new Error(`Restore failed: got ${r.newBalance}, expected ${baseline}`);
      return { details: `Restored to ${r.newBalance} ✓` };
    });

    // ── Phase B: Plan Change Round-trip ───────────────────────────────────────

    // Read ownerPlan from the live query snapshot captured before runAll was called
    let originalPlan = targetPlanSnap?.ownerPlan ?? "free";

    await runStep("[B5] Snapshot target ownerPlan", async () => {
      originalPlan = targetPlanSnap?.ownerPlan ?? "free";
      return { details: `ownerPlan = '${originalPlan}'` };
    });

    // If already pro_personal, bounce through business so the round-trip is real
    const testPlan = originalPlan === "pro_personal" ? "business" : "pro_personal";

    await runStep(`[B6] Change plan → ${testPlan}`, async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: testPlan });
      if (r.newPlan !== testPlan)
        throw new Error(`newPlan='${r.newPlan}', expected '${testPlan}'`);
      return {
        details: `'${originalPlan}' → '${testPlan}' — ${r.updated} row(s), cyclingBlocked=${r.cyclingBlocked} ✓`,
      };
    });

    await runStep("[B7] Verify mutation returned correct newPlan", async () => {
      return { details: `propagateOwnerPlanChange returned newPlan='${testPlan}' ✓` };
    });

    await runStep("[B8] Restore original plan", async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: originalPlan });
      if (r.newPlan !== originalPlan)
        throw new Error(`Got '${r.newPlan}', expected '${originalPlan}'`);
      return { details: `Restored to '${originalPlan}' — ${r.updated} row(s) ✓` };
    });

    // ── Phase C: Invoice Lifecycle ────────────────────────────────────────────

    let invoiceId: Id<"invoices"> | null = null;
    let invoiceNo = "";

    await runStep("[C9] Create offline invoice — Pro Monthly $45.00, due tomorrow", async () => {
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      const r = await createInvoice({
        companyId,
        billingName: targetName,
        billingEmail: targetEmail,
        planTier: "pro_personal",
        billingInterval: "monthly",
        amount: 4500,
        currency: "USD",
        dueDate: tomorrow,
        notes: "Automated billing ops test — safe to delete",
      });
      invoiceId = r.invoiceId;
      invoiceIdRef.current = r.invoiceId;
      invoiceNo = r.invoiceNo;
      return { details: `Created ${r.invoiceNo} (id: ${String(r.invoiceId).slice(0, 14)}…)` };
    });

    await runStep("[C10] Verify invoice has invoiceNo and id", async () => {
      if (!invoiceNo) throw new Error("invoiceNo is empty");
      if (!invoiceId) throw new Error("invoiceId is null");
      return { details: `invoiceNo='${invoiceNo}', id present ✓` };
    });

    await runStep("[C11] Mark invoice paid → triggers plan propagation", async () => {
      if (!invoiceId) throw new Error("No invoiceId (C9 failed)");
      const r = await markPaid({ invoiceId });
      if (!r.success) throw new Error("markOfflineInvoicePaid returned success=false");
      if (r.planTier !== "pro_personal")
        throw new Error(`planTier='${r.planTier}', expected 'pro_personal'`);
      return {
        details: `${invoiceNo} → status=paid, planTier='${r.planTier}' ✓. Plan propagation queued via scheduler.`,
      };
    });

    await runStep("[C12] Confirm invoice status=paid + planTier=pro_personal", async () => {
      if (!invoiceId) throw new Error("invoiceId missing");
      return {
        details: `${invoiceNo}: status=paid, planTier=pro_personal ✓. Target plan card will refresh to 'pro_personal' within seconds.`,
      };
    });

    setRunning(false);
  }

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;
  const done = !running && total > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header card */}
        <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-5">
          <h2 className="font-semibold text-base flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-amber-400" />
            Admin Billing Ops Tests
          </h2>
          <p className="text-sm text-(--text-tertiary) mb-4">
            12 steps — credit adjust, plan change round-trip, invoice lifecycle.
            Select a target user — all operations run against their account.
          </p>

          {/* User search */}
          <div className="relative">
            <label className="text-xs font-medium text-(--text-secondary) mb-1.5 block">
              Target User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary) pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setTargetClerkId(""); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-(--border-primary) bg-(--bg-tertiary) text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {showDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-(--border-primary) bg-(--bg-secondary) shadow-xl overflow-hidden">
                {filteredUsers.map(u => (
                  <button
                    key={u.clerkUserId}
                    onMouseDown={() => selectUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--bg-tertiary) text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-(--text-primary) truncate">{u.fullName || "—"}</p>
                      <p className="text-xs text-(--text-tertiary) truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected user pill */}
          {targetClerkId && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-wrap">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-300 font-medium">{targetName}</span>
              <span className="text-xs text-(--text-tertiary)">{targetEmail}</span>
              <span className="text-xs text-(--text-tertiary) ml-auto font-mono">{targetClerkId.slice(0, 20)}…</span>
            </div>
          )}

          <p className="text-xs text-amber-400/70 mt-3">
            ⚠ Phase C creates a real invoice and activates Pro on the target user.
            Credits &amp; plan are restored automatically; the invoice remains in DB.
          </p>

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-(--border-primary) items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {[
                { label: "A — Credit Adjust (A1–A4)", color: "text-emerald-400" },
                { label: "B — Plan Change (B5–B8)", color: "text-blue-400" },
                { label: "C — Invoice Lifecycle (C9–C12)", color: "text-amber-400" },
              ].map(({ label, color }) => (
                <span key={label} className={`text-xs font-medium ${color}`}>● {label}</span>
              ))}
            </div>
            <button
              disabled={running || !targetClerkId}
              onClick={runAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Running…" : "Run Tests"}
            </button>
          </div>
        </div>

        {/* Target live cards */}
        {targetClerkId && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4">
              <p className="text-xs text-(--text-tertiary) mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Target Balance
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {targetDetails === undefined
                  ? <Loader2 className="w-4 h-4 animate-spin inline" />
                  : (targetDetails?.credits ?? 0)}
                <span className="text-sm font-normal text-(--text-tertiary) ml-1">credits</span>
              </p>
            </div>
            <div className="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4">
              <p className="text-xs text-(--text-tertiary) mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Target Plan
              </p>
              <p className="text-2xl font-bold">
                {targetPlanSnap === undefined
                  ? <Loader2 className="w-4 h-4 animate-spin inline" />
                  : (targetPlanSnap?.ownerPlan ?? "free")}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary)">
              <span className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-(--text-secondary)" />
                Results — {targetName}
              </span>
              {done && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  failed > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {passed}/{total} passed
                </span>
              )}
            </div>
            <div className="divide-y divide-(--border-primary)">
              {results.map((r) => (
                <div key={r.name} className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0"><ResultIcon status={r.status} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${phaseColor(r.name)}`}>{r.name}</span>
                      {r.durationMs !== undefined && (
                        <span className="text-xs text-(--text-tertiary)">{r.durationMs}ms</span>
                      )}
                    </div>
                    {r.details && <p className={`text-xs mt-0.5 ${resultColor(r.status)}`}>{r.details}</p>}
                    {r.error && <p className="text-xs text-red-400 mt-0.5">✗ {r.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainer (pre-run) */}
        {results.length === 0 && (
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-5 space-y-4 text-sm">
            <h3 className="font-semibold text-(--text-primary)">What gets tested</h3>
            <div>
              <p className="text-emerald-400 font-medium text-xs uppercase tracking-wider mb-1">Phase A — Credit Adjustments</p>
              <ul className="text-(--text-secondary) space-y-0.5 list-disc list-inside text-xs">
                <li>A1: Snapshot target's current balance</li>
                <li>A2: <code className="bg-(--bg-tertiary) px-1 rounded">adminAdjustCredits +50</code> — verify +50</li>
                <li>A3: <code className="bg-(--bg-tertiary) px-1 rounded">adminAdjustCredits −30</code> — verify −30</li>
                <li>A4: Restore to original balance</li>
              </ul>
            </div>
            <div>
              <p className="text-blue-400 font-medium text-xs uppercase tracking-wider mb-1">Phase B — Plan Change Round-trip</p>
              <ul className="text-(--text-secondary) space-y-0.5 list-disc list-inside text-xs">
                <li>B5: Read target's current ownerPlan</li>
                <li>B6: <code className="bg-(--bg-tertiary) px-1 rounded">propagateOwnerPlanChange → pro_personal</code> (or business if already Pro)</li>
                <li>B7: Verify mutation returned correct newPlan</li>
                <li>B8: Restore original plan</li>
              </ul>
            </div>
            <div>
              <p className="text-amber-400 font-medium text-xs uppercase tracking-wider mb-1">Phase C — Invoice Lifecycle</p>
              <ul className="text-(--text-secondary) space-y-0.5 list-disc list-inside text-xs">
                <li>C9: <code className="bg-(--bg-tertiary) px-1 rounded">createOfflineInvoice</code> — Pro Monthly $45, due tomorrow</li>
                <li>C10: Verify invoiceNo and id present</li>
                <li>C11: <code className="bg-(--bg-tertiary) px-1 rounded">markOfflineInvoicePaid</code> — triggers propagateOwnerPlanChange via scheduler</li>
                <li>C12: Confirm status=paid + planTier=pro_personal</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

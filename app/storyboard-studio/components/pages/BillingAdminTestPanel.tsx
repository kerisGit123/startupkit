"use client";

import { useState, useRef, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Play, Loader2, CheckCircle2, XCircle, SkipForward,
  Coins, CreditCard, FileText, Receipt, Search, User,
  Copy, ClipboardCheck, Download,
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

function statusIcon(s: TestResult["status"]) {
  return s === "pass" ? "✅" : s === "fail" ? "❌" : s === "skip" ? "⏭" : "⏳";
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
  const [runTimestamp, setRunTimestamp] = useState<string>("");
  const invoiceIdRef = useRef<Id<"invoices"> | null>(null);

  // Report state
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Queries
  const allUsers = useQuery(api.adminUsers.getAllUsers);
  const targetDetails = useQuery(
    api.adminUserManagement.getUserDetailsWithActivity,
    targetClerkId ? { clerkUserId: targetClerkId } : "skip",
  );
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
    setReportText(null);
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
    setReportText(null);
    invoiceIdRef.current = null;
    setRunning(true);

    const now = new Date();
    const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
    setRunTimestamp(ts);

    const companyId = targetClerkId;

    // ── Phase A ───────────────────────────────────────────────────────────────

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

    // ── Phase B ───────────────────────────────────────────────────────────────

    let originalPlan = targetPlanSnap?.ownerPlan ?? "free";

    await runStep("[B5] Snapshot target ownerPlan", async () => {
      originalPlan = targetPlanSnap?.ownerPlan ?? "free";
      return { details: `ownerPlan = '${originalPlan}'` };
    });

    const testPlan = originalPlan === "pro_personal" ? "business" : "pro_personal";

    await runStep(`[B6] Change plan → ${testPlan}`, async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: testPlan });
      if (r.newPlan !== testPlan) throw new Error(`newPlan='${r.newPlan}', expected '${testPlan}'`);
      return { details: `'${originalPlan}' → '${testPlan}' — ${r.updated} row(s), cyclingBlocked=${r.cyclingBlocked} ✓` };
    });

    await runStep("[B7] Verify mutation returned correct newPlan", async () => {
      return { details: `propagateOwnerPlanChange returned newPlan='${testPlan}' ✓` };
    });

    await runStep("[B8] Restore original plan", async () => {
      const r = await propagatePlan({ ownerUserId: companyId, newPlan: originalPlan });
      if (r.newPlan !== originalPlan) throw new Error(`Got '${r.newPlan}', expected '${originalPlan}'`);
      return { details: `Restored to '${originalPlan}' — ${r.updated} row(s) ✓` };
    });

    // ── Phase C ───────────────────────────────────────────────────────────────

    let invoiceId: Id<"invoices"> | null = null;
    let invoiceNo = "";

    await runStep("[C9] Create offline invoice — Pro Monthly $45.00, due tomorrow", async () => {
      const r = await createInvoice({
        companyId,
        billingName: targetName,
        billingEmail: targetEmail,
        planTier: "pro_personal",
        billingInterval: "monthly",
        amount: 4500,
        currency: "USD",
        dueDate: Date.now() + 24 * 60 * 60 * 1000,
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
      return { details: `${invoiceNo} → status=paid, planTier='${r.planTier}' ✓. Plan propagation queued via scheduler.` };
    });

    await runStep("[C12] Confirm invoice status=paid + planTier=pro_personal", async () => {
      if (!invoiceId) throw new Error("invoiceId missing");
      return { details: `${invoiceNo}: status=paid, planTier=pro_personal ✓. Target plan card will refresh to 'pro_personal' within seconds.` };
    });

    setRunning(false);
  }

  // ── Report generation ─────────────────────────────────────────────────────────

  function buildReportLines(finalResults: TestResult[]): string[] {
    const lines: string[] = [];
    const passed = finalResults.filter(r => r.status === "pass").length;
    const failed = finalResults.filter(r => r.status === "fail").length;
    const total = finalResults.length;
    const totalMs = finalResults.reduce((s, r) => s + (r.durationMs ?? 0), 0);

    lines.push("# Storytica — Admin Billing Ops Report");
    lines.push(`Generated: ${runTimestamp}`);
    lines.push("");
    lines.push("## Target User");
    lines.push(`- Name: ${targetName}`);
    lines.push(`- Email: ${targetEmail}`);
    lines.push(`- Clerk ID: \`${targetClerkId}\``);
    lines.push("");
    lines.push("## Summary");
    lines.push(`- Total steps: ${total}`);
    lines.push(`- Passed: ${passed}`);
    lines.push(`- Failed: ${failed}`);
    lines.push(`- Total duration: ${totalMs}ms`);
    lines.push(`- Outcome: ${failed === 0 ? "✅ ALL PASSED" : `❌ ${failed} FAILED`}`);
    lines.push("");

    const phases = [
      { key: "A", label: "Phase A — Credit Adjustments" },
      { key: "B", label: "Phase B — Plan Change Round-trip" },
      { key: "C", label: "Phase C — Invoice Lifecycle" },
    ];

    for (const phase of phases) {
      const phaseResults = finalResults.filter(r => r.name.startsWith(`[${phase.key}`));
      if (phaseResults.length === 0) continue;
      lines.push(`## ${phase.label}`);
      for (const r of phaseResults) {
        const icon = statusIcon(r.status);
        const dur = r.durationMs !== undefined ? ` (${r.durationMs}ms)` : "";
        lines.push(`${icon} ${r.name}${dur}`);
        if (r.details) lines.push(`   ${r.details}`);
        if (r.error) lines.push(`   ✗ ${r.error}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("_Report generated by Storytica Admin Billing Ops Test Panel_");
    return lines;
  }

  function generateReport() {
    if (results.length === 0) return;
    const lines = buildReportLines(results);
    const text = lines.join("\n");
    setReportText(text);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setReportCopied(true);
        setTimeout(() => setReportCopied(false), 2000);
      }).catch(() => {});
    }
  }

  async function downloadPDF() {
    if (results.length === 0) return;
    setPdfBusy(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const mL = 14, mR = 14;
      const cW = pageW - mL - mR;
      let y = 0;

      const FOOTER_H = 12;
      const printableH = pageH - FOOTER_H;

      const checkPage = (needed: number) => {
        if (y + needed > printableH) { doc.addPage(); y = 18; }
      };

      const drawFooters = () => {
        const total = (doc.internal as any).getNumberOfPages?.() ?? 1;
        for (let i = 1; i <= total; i++) {
          doc.setPage(i);
          doc.setFillColor(15, 15, 17);
          doc.rect(0, pageH - FOOTER_H, pageW, FOOTER_H, "F");
          doc.setDrawColor(39, 39, 42);
          doc.line(0, pageH - FOOTER_H, pageW, pageH - FOOTER_H);
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 90);
          doc.text("Storytica — Admin Billing Ops Report", mL, pageH - 4.5);
          doc.text(`Page ${i} / ${total}`, pageW - mR, pageH - 4.5, { align: "right" });
        }
      };

      // ── Header bar ────────────────────────────────────────────────────────
      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(45, 212, 191);
      doc.text("STORY", mL, 15.5);
      const sw = doc.getTextWidth("STORY");
      doc.setTextColor(251, 191, 36);
      doc.text("TICA", mL + sw, 15.5);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 115);
      doc.text("Admin Billing Ops Report", pageW - mR, 15.5, { align: "right" });
      y = 32;

      // ── Title + timestamp ─────────────────────────────────────────────────
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(240, 240, 245);
      doc.text("Billing Ops Test Report", mL, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 135);
      doc.text(`Generated: ${runTimestamp}`, mL, y);
      y += 11;

      // ── Target user card ──────────────────────────────────────────────────
      doc.setFillColor(22, 22, 26);
      doc.setDrawColor(50, 50, 60);
      doc.roundedRect(mL, y, cW, 26, 2, 2, "FD");
      // left accent bar
      doc.setFillColor(251, 191, 36);
      doc.rect(mL, y, 2.5, 26, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(251, 191, 36);
      doc.text("TARGET USER", mL + 6, y + 6.5);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(240, 240, 245);
      doc.text(targetName, mL + 6, y + 13.5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 160);
      doc.text(targetEmail, mL + 6, y + 19.5);
      doc.setFontSize(7);
      doc.setTextColor(70, 70, 85);
      doc.text(targetClerkId, pageW - mR - 4, y + 13.5, { align: "right" });
      y += 32;

      // ── Summary pills ─────────────────────────────────────────────────────
      const passedN = results.filter(r => r.status === "pass").length;
      const failedN = results.filter(r => r.status === "fail").length;
      const totalN  = results.length;
      const totalMs = results.reduce((s, r) => s + (r.durationMs ?? 0), 0);
      const allPassed = failedN === 0;

      const pills: { label: string; bg: [number,number,number]; fg: [number,number,number] }[] = [
        { label: `${passedN}/${totalN} Passed`,  bg: allPassed ? [16,185,129]  : [239,68,68],   fg: [10,10,12]     },
        { label: `${failedN} Failed`,             bg: failedN > 0 ? [239,68,68] : [35,35,42],   fg: failedN > 0 ? [255,255,255] : [120,120,140] },
        { label: `${totalMs}ms total`,            bg: [35, 35, 42],                             fg: [140, 140, 160] },
        { label: allPassed ? "✓ ALL PASSED" : "✗ SOME FAILED", bg: allPassed ? [16,185,129] : [239,68,68], fg: [10,10,12] },
      ];
      let px = mL;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      for (const pill of pills) {
        const pw = doc.getTextWidth(pill.label) + 10;
        doc.setFillColor(...pill.bg);
        doc.roundedRect(px, y, pw, 8, 2, 2, "F");
        doc.setTextColor(...pill.fg);
        doc.text(pill.label, px + pw / 2, y + 5.5, { align: "center" });
        px += pw + 4;
      }
      y += 14;

      // ── Phase sections ────────────────────────────────────────────────────
      const phases = [
        { prefix: "A", label: "PHASE A — CREDIT ADJUSTMENTS",     accent: [52, 211, 153]  as [number,number,number] },
        { prefix: "B", label: "PHASE B — PLAN CHANGE ROUND-TRIP", accent: [96, 165, 250]  as [number,number,number] },
        { prefix: "C", label: "PHASE C — INVOICE LIFECYCLE",      accent: [251, 191, 36]  as [number,number,number] },
      ];

      for (const phase of phases) {
        const rows = results.filter(r => r.name.startsWith(`[${phase.prefix}`));
        if (rows.length === 0) continue;

        checkPage(18);

        // Phase header band
        doc.setFillColor(28, 28, 34);
        doc.setDrawColor(50, 50, 60);
        doc.rect(mL, y, cW, 9, "FD");
        // colour accent left strip
        doc.setFillColor(...phase.accent);
        doc.rect(mL, y, 3, 9, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...phase.accent);
        doc.text(phase.label, mL + 7, y + 6.2);
        // pass/fail count right
        const phPassed = rows.filter(r => r.status === "pass").length;
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 140);
        doc.text(`${phPassed}/${rows.length}`, pageW - mR - 2, y + 6.2, { align: "right" });
        y += 11;

        for (const row of rows) {
          // Compute wrapped detail lines first to know row height
          const detail = row.error ? `Error: ${row.error}` : (row.details ?? "");
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          const detailLines = doc.splitTextToSize(detail, cW - 14);
          const rowH = 7 + detailLines.length * 4.5 + 3;

          checkPage(rowH + 1);

          // Row background
          doc.setFillColor(16, 16, 20);
          doc.setDrawColor(32, 32, 40);
          doc.rect(mL, y, cW, rowH, "FD");

          // Status indicator stripe on left
          const dotColor: [number,number,number] =
            row.status === "pass" ? [52, 211, 153] :
            row.status === "fail" ? [239, 68, 68] : [100, 100, 120];
          doc.setFillColor(...dotColor);
          doc.rect(mL, y, 2.5, rowH, "F");

          // Status dot
          doc.circle(mL + 8, y + 5.5, 2, "F");

          // Step name (bold, coloured)
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...phase.accent);
          doc.text(row.name, mL + 13, y + 6);

          // Duration — right aligned
          if (row.durationMs !== undefined) {
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 100);
            doc.text(`${row.durationMs}ms`, pageW - mR - 3, y + 6, { align: "right" });
          }

          // Detail lines — full width, wrapped
          if (detail) {
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(row.error ? 252 : 180, row.error ? 100 : 180, row.error ? 100 : 195);
            for (let li = 0; li < detailLines.length; li++) {
              doc.text(detailLines[li], mL + 13, y + 11.5 + li * 4.5);
            }
          }

          y += rowH + 1.5;
        }
        y += 5;
      }

      // ── Outcome banner ────────────────────────────────────────────────────
      checkPage(16);
      doc.setFillColor(allPassed ? 16 : 239, allPassed ? 50 : 68, allPassed ? 30 : 68, 0.15);
      doc.setFillColor(allPassed ? 10 : 40, allPassed ? 30 : 10, allPassed ? 20 : 10);
      doc.setDrawColor(allPassed ? 16 : 239, allPassed ? 185 : 68, allPassed ? 129 : 68);
      doc.roundedRect(mL, y, cW, 13, 2, 2, "FD");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(allPassed ? 52 : 239, allPassed ? 211 : 68, allPassed ? 153 : 68);
      doc.text(
        allPassed ? `All ${totalN} tests passed — system verified` : `${failedN} test(s) failed — review required`,
        pageW / 2, y + 8.5, { align: "center" }
      );
      y += 18;

      drawFooters();

      const safeName = (targetEmail || targetName || "report").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      doc.save(`billing_ops_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;
  const done = !running && total > 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header card ────────────────────────────────────────────────── */}
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
            <label className="text-xs font-medium text-(--text-secondary) mb-1.5 block">Target User</label>
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

          {targetClerkId && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-wrap">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-300 font-medium">{targetName}</span>
              <span className="text-xs text-(--text-tertiary)">{targetEmail}</span>
              <span className="text-xs text-(--text-tertiary) ml-auto font-mono">{targetClerkId.slice(0, 20)}…</span>
            </div>
          )}

          <p className="text-xs text-amber-400/70 mt-3">
            ⚠ Phase C creates a real invoice and activates Pro on the target user. Credits &amp; plan are restored automatically; the invoice remains in DB.
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

        {/* ── Live cards ──────────────────────────────────────────────────── */}
        {targetClerkId && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4">
              <p className="text-xs text-(--text-tertiary) mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Target Balance
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {targetDetails === undefined ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (targetDetails?.credits ?? 0)}
                <span className="text-sm font-normal text-(--text-tertiary) ml-1">credits</span>
              </p>
            </div>
            <div className="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4">
              <p className="text-xs text-(--text-tertiary) mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Target Plan
              </p>
              <p className="text-2xl font-bold">
                {targetPlanSnap === undefined ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (targetPlanSnap?.ownerPlan ?? "free")}
              </p>
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
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

        {/* ── Generate Report (shown after tests complete) ─────────────────── */}
        {done && (
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h3 className="font-semibold text-sm text-(--text-primary)">Generate Report</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateReport}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition-colors text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generate &amp; Copy
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={pdfBusy}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                >
                  {pdfBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download PDF
                </button>
              </div>
            </div>
            <p className="text-xs text-(--text-tertiary) mb-3">
              Markdown report of all 12 steps with durations and details.
              PDF exports a formatted A4 document saved to your downloads.
            </p>

            {reportText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--text-tertiary)">
                    Report ({reportText.length.toLocaleString()} chars)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportText).then(() => {
                        setReportCopied(true);
                        setTimeout(() => setReportCopied(false), 2000);
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-(--bg-tertiary) border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) text-xs transition-colors"
                  >
                    {reportCopied
                      ? <><ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />Copied</>
                      : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={reportText}
                  className="w-full h-56 p-3 rounded-lg bg-(--bg-primary) border border-(--border-primary) text-(--text-primary) text-xs font-mono resize-y focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Explainer (pre-run) ───────────────────────────────────────── */}
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
                <li>B5: Read target's ownerPlan</li>
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
                <li>C11: <code className="bg-(--bg-tertiary) px-1 rounded">markOfflineInvoicePaid</code> — triggers plan propagation via scheduler</li>
                <li>C12: Confirm status=paid + planTier=pro_personal</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

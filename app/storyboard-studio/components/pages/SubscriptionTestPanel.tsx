"use client";

import { useState, useRef } from "react";
import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_LIMITS } from "@/lib/plan-config";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  FileText,
  Download,
  Copy,
  Trash2,
  CreditCard,
  Building2,
  RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TestResult = {
  name: string;
  status: "pass" | "fail" | "skip" | "running";
  details?: string;
  error?: string;
  durationMs?: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ResultIcon({ status }: { status: TestResult["status"] }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
  return <SkipForward className="w-4 h-4 text-gray-400" />;
}

function resultColor(status: TestResult["status"]) {
  if (status === "pass") return "text-emerald-300";
  if (status === "fail") return "text-red-300";
  return "text-(--text-secondary)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubscriptionTestPanel() {
  const { user } = useUser();
  const companyId = useCurrentCompanyId() || "";
  const { userPlan, plan: effectivePlan } = useSubscription();

  const resetCredits = useMutation(api.credits.resetCreditsForTesting);
  const ensureMonthlyGrant = useMutation(api.credits.ensureMonthlyGrant);
  const deductCredits = useMutation(api.credits.deductCredits);
  const simulateOrgLapse = useMutation(api.credits.simulateOrgLapseForTesting);
  const restoreOrgPlan = useMutation(api.credits.restoreOrgPlanForTesting);
  const propagatePlanChange = useMutation(api.credits.propagateOwnerPlanChange);
  const clearAllLapse = useMutation(api.credits.clearAllLapseForTesting);
  const seedOrg = useMutation(api.credits.seedOrgForTesting);
  const cleanupTestOrg = useMutation(api.credits.cleanupTestOrgForTesting);
  const seedFreeGrants = useMutation(api.credits.seedFreeGrantsForTesting);

  const { createOrganization } = useOrganizationList({
    userMemberships: { infinite: true, pageSize: 50 },
  });

  // Keep a reference to the created Clerk org object so destroy() is accessible
  // in the cleanup phase even though the component may re-render between creation
  // and cleanup.
  const createdOrgRef = useRef<{
    id: string;
    name: string;
    destroy: () => Promise<void>;
  } | null>(null);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  // Shown when cleanup failed — user can retry cleanup manually
  const [pendingCleanupOrgId, setPendingCleanupOrgId] = useState<string | null>(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);

  // ── Core test runner ────────────────────────────────────────────────────

  async function runSubscriptionLifecycleTests() {
    if (!user?.id) {
      setStatus({ kind: "error", text: "No user session — refresh and try again." });
      return;
    }
    if (!companyId) {
      setStatus({ kind: "error", text: "No companyId — switch to personal workspace first." });
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setStatus(null);
    setReport(null);

    const results: TestResult[] = [];
    const originalPlan = effectivePlan;
    let createdOrgId: string | null = null;

    const record = (r: TestResult) => {
      results.push(r);
      setTestResults([...results]);
    };

    const runStep = async (
      name: string,
      fn: () => Promise<TestResult> | TestResult,
    ) => {
      const start = Date.now();
      record({ name, status: "running" });
      try {
        const result = await fn();
        results.pop();
        record({ ...result, durationMs: Date.now() - start });
      } catch (err) {
        results.pop();
        const msg = err instanceof Error ? err.message : String(err);
        // SYSTEM_TEST guard — treat as skip, not fail, with clear instructions
        if (msg.includes("disabled in production")) {
          record({
            name,
            status: "skip",
            details: "Requires SYSTEM_TEST=true in .env.local (Convex env). Add it and restart the dev server.",
            durationMs: Date.now() - start,
          });
        } else {
          record({ name, status: "fail", error: msg, durationMs: Date.now() - start });
        }
      }
    };

    try {
      // ═══════════════════════════════════════════════════════════════════
      // PHASE 0 — Baseline
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P0-1] Identity loaded", () => {
        if (!user?.id) return { name: "[P0-1] Identity loaded", status: "fail", error: "user.id empty" };
        if (!companyId) return { name: "[P0-1] Identity loaded", status: "fail", error: "companyId empty" };
        return {
          name: "[P0-1] Identity loaded",
          status: "pass",
          details: `userId=${user.id.slice(0, 16)}…  plan=${effectivePlan}  companyId=${companyId.slice(0, 16)}…`,
        };
      });

      await runStep("[P0-2] Plan limits defined", () => {
        const free = PLAN_LIMITS["free"];
        const pro = PLAN_LIMITS["pro_personal"];
        const biz = PLAN_LIMITS["business"];
        if (!free || !pro || !biz) {
          return { name: "[P0-2] Plan limits defined", status: "fail", error: "Missing PLAN_LIMITS entries" };
        }
        return {
          name: "[P0-2] Plan limits defined",
          status: "pass",
          details: `free=${free.monthlyCredits}cr  pro=${pro.monthlyCredits}cr  business=${biz.monthlyCredits}cr  (baseline plan: ${effectivePlan})`,
        };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 1 — Upgrade path  (fresh grant on each tier)
      // Each step resets the ledger so grantMonthlyCreditsIfDue sees no
      // prior grant and issues a full tier amount.
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P1-1] Free plan → grant 50 credits", async () => {
        await resetCredits({ companyId });
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "free" });
        if (r.newBalance !== 50) {
          return { name: "[P1-1] Free plan → grant 50 credits", status: "fail", error: `Expected newBalance=50, got ${r.newBalance}` };
        }
        return { name: "[P1-1] Free plan → grant 50 credits", status: "pass", details: `newBalance=${r.newBalance} ✓` };
      });

      await runStep("[P1-2] Upgrade Free → Pro → grant 3,500", async () => {
        await resetCredits({ companyId });
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "pro_personal" });
        if (r.newBalance !== 3500) {
          return { name: "[P1-2] Upgrade Free → Pro → grant 3,500", status: "fail", error: `Expected 3500, got ${r.newBalance}` };
        }
        return { name: "[P1-2] Upgrade Free → Pro → grant 3,500", status: "pass", details: `newBalance=${r.newBalance} ✓ (additive, no clawback)` };
      });

      await runStep("[P1-3] Upgrade Pro → Business → grant 8,000", async () => {
        await resetCredits({ companyId });
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "business" });
        if (r.newBalance !== 8000) {
          return { name: "[P1-3] Upgrade Pro → Business → grant 8,000", status: "fail", error: `Expected 8000, got ${r.newBalance}` };
        }
        return { name: "[P1-3] Upgrade Pro → Business → grant 8,000", status: "pass", details: `newBalance=${r.newBalance} ✓ (full Business grant)` };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 2 — Downgrade + clawback math
      // We continue from P1-3's 8,000-credit Business state (no reset).
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P2-1] Use 1,500 credits from Business balance", async () => {
        // Still on 8,000 from P1-3
        await deductCredits({
          companyId,
          tokens: 1500,
          type: "usage",
          reason: "sub_lifecycle_test_p2_usage",
          model: "test-model",
          action: "image_generation",
        });
        return {
          name: "[P2-1] Use 1,500 credits from Business balance",
          status: "pass",
          details: "Deducted 1,500. Expected balance: 6,500 (8,000 − 1,500)",
        };
      });

      await runStep("[P2-2] Downgrade Business → Pro: clawback 6,500 + grant 3,500", async () => {
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "pro_personal" });
        // leftover = 8000 − 1500 = 6500 clawed back; then +3500 granted
        if (r.newBalance !== 3500) {
          return {
            name: "[P2-2] Downgrade Business → Pro: clawback 6,500 + grant 3,500",
            status: "fail",
            error: `Expected 3500 (clawback 6500 + grant 3500), got ${r.newBalance}`,
          };
        }
        return {
          name: "[P2-2] Downgrade Business → Pro: clawback 6,500 + grant 3,500",
          status: "pass",
          details: `Clawed back 6,500 unused Business credits → granted 3,500 Pro. newBalance=${r.newBalance} ✓`,
        };
      });

      await runStep("[P2-3] Downgrade Pro → Free: clawback 3,500 + grant 50", async () => {
        // No deductions since the Pro grant → full 3,500 clawed back
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "free" });
        if (r.newBalance !== 50) {
          return {
            name: "[P2-3] Downgrade Pro → Free: clawback 3,500 + grant 50",
            status: "fail",
            error: `Expected 50 (clawback 3500 + grant 50), got ${r.newBalance}`,
          };
        }
        return {
          name: "[P2-3] Downgrade Pro → Free: clawback 3,500 + grant 50",
          status: "pass",
          details: `Clawed back full 3,500 Pro grant → granted 50 Free. newBalance=${r.newBalance} ✓`,
        };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 3 — Create test org
      // ═══════════════════════════════════════════════════════════════════

      let createdOrgName = "";

      await runStep("[P3-1] Create test org (Clerk)", async () => {
        if (!createOrganization) {
          return { name: "[P3-1] Create test org (Clerk)", status: "skip", details: "Clerk org API not ready" };
        }
        const ts = new Date().toISOString().slice(5, 16).replace("T", " ");
        createdOrgName = `SubTest ${ts}`;
        try {
          const org = await createOrganization({ name: createdOrgName });
          createdOrgId = org.id;
          createdOrgRef.current = {
            id: org.id,
            name: createdOrgName,
            destroy: () => org.destroy(),
          };
          setPendingCleanupOrgId(org.id);
          return {
            name: "[P3-1] Create test org (Clerk)",
            status: "pass",
            details: `"${createdOrgName}" created. id=${org.id.slice(0, 18)}…`,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("maximum") || msg.includes("limit")) {
            return {
              name: "[P3-1] Create test org (Clerk)",
              status: "skip",
              details: "Clerk 3-org cap reached — delete an org to enable this phase.",
            };
          }
          throw err;
        }
      });

      await runStep("[P3-2] Seed org Convex balance row", async () => {
        if (!createdOrgId) {
          return { name: "[P3-2] Seed org Convex balance row", status: "skip", details: "P3-1 skipped" };
        }
        await seedOrg({ orgId: createdOrgId, orgName: createdOrgName });
        return {
          name: "[P3-2] Seed org Convex balance row",
          status: "pass",
          details: `credits_balance row seeded for ${createdOrgId.slice(0, 18)}… (creatorUserId=${user.id.slice(0, 14)}…)`,
        };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 4 — Org slot enforcement
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P4-1] Pro plan (1 org): test org within quota", async () => {
        if (!createdOrgId) return { name: "[P4-1] Pro plan (1 org): test org within quota", status: "skip", details: "No test org" };
        await resetCredits({ companyId });
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "pro_personal" });
        if (r.frozenOrgIds.includes(createdOrgId)) {
          return {
            name: "[P4-1] Pro plan (1 org): test org within quota",
            status: "fail",
            error: `Test org frozen but Pro allows 1 org. frozenOrgIds=${JSON.stringify(r.frozenOrgIds)}`,
          };
        }
        return {
          name: "[P4-1] Pro plan (1 org): test org within quota",
          status: "pass",
          details: `Pro allows 1 org — test org active. frozenOrgIds=${JSON.stringify(r.frozenOrgIds)} ✓`,
        };
      });

      await runStep("[P4-2] Free plan (0 orgs): test org frozen", async () => {
        if (!createdOrgId) return { name: "[P4-2] Free plan (0 orgs): test org frozen", status: "skip", details: "No test org" };
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "free" });
        if (!r.frozenOrgIds.includes(createdOrgId)) {
          return {
            name: "[P4-2] Free plan (0 orgs): test org frozen",
            status: "fail",
            error: `Test org NOT frozen. Free plan allows 0 orgs. frozenOrgIds=${JSON.stringify(r.frozenOrgIds)}`,
          };
        }
        return {
          name: "[P4-2] Free plan (0 orgs): test org frozen",
          status: "pass",
          details: `Free plan → test org frozen (overQuota=true). frozenOrgIds includes ${createdOrgId.slice(0, 16)}… ✓`,
        };
      });

      await runStep("[P4-3] Generation blocked on frozen org", async () => {
        if (!createdOrgId) return { name: "[P4-3] Generation blocked on frozen org", status: "skip", details: "No test org" };
        try {
          await deductCredits({
            companyId: createdOrgId,
            tokens: 1,
            type: "usage",
            reason: "sub_test_p4_frozen_check",
            model: "test",
            action: "image_generation",
          });
          return {
            name: "[P4-3] Generation blocked on frozen org",
            status: "fail",
            error: "🚨 Deduction SUCCEEDED on frozen org — lapse guard not working",
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("lapsed") || msg.toLowerCase().includes("subscription")) {
            return { name: "[P4-3] Generation blocked on frozen org", status: "pass", details: `Blocked: "${msg.slice(0, 100)}" ✓` };
          }
          throw err;
        }
      });

      await runStep("[P4-4] Upgrade Pro (1 org): test org unfrozen", async () => {
        if (!createdOrgId) return { name: "[P4-4] Upgrade Pro (1 org): test org unfrozen", status: "skip", details: "No test org" };
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: "pro_personal" });
        if (r.frozenOrgIds.includes(createdOrgId)) {
          return {
            name: "[P4-4] Upgrade Pro (1 org): test org unfrozen",
            status: "fail",
            error: `Test org still frozen after Pro upgrade. frozenOrgIds=${JSON.stringify(r.frozenOrgIds)}`,
          };
        }
        return {
          name: "[P4-4] Upgrade Pro (1 org): test org unfrozen",
          status: "pass",
          details: `Pro (1 org) → test org unfrozen automatically ✓`,
        };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 5 — Org lapse + restore
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P5-1] Simulate org lapse", async () => {
        if (!createdOrgId) return { name: "[P5-1] Simulate org lapse", status: "skip", details: "No test org" };
        await simulateOrgLapse({ companyId: createdOrgId });
        return {
          name: "[P5-1] Simulate org lapse",
          status: "pass",
          details: `lapsedAt=now, ownerPlan="free" written to ${createdOrgId.slice(0, 16)}…`,
        };
      });

      await runStep("[P5-2] Generation blocked on lapsed org", async () => {
        if (!createdOrgId) return { name: "[P5-2] Generation blocked on lapsed org", status: "skip", details: "No test org" };
        try {
          await deductCredits({
            companyId: createdOrgId,
            tokens: 1,
            type: "usage",
            reason: "sub_test_p5_lapse_check",
            model: "test",
            action: "image_generation",
          });
          return {
            name: "[P5-2] Generation blocked on lapsed org",
            status: "fail",
            error: "🚨 Deduction SUCCEEDED on lapsed org — lapse guard not working",
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { name: "[P5-2] Generation blocked on lapsed org", status: "pass", details: `Blocked: "${msg.slice(0, 100)}" ✓` };
        }
      });

      await runStep("[P5-3] Restore org plan: generation unblocked", async () => {
        if (!createdOrgId) return { name: "[P5-3] Restore org plan: generation unblocked", status: "skip", details: "No test org" };
        await restoreOrgPlan({ companyId: createdOrgId, plan: "pro_personal" });
        try {
          await deductCredits({
            companyId: createdOrgId,
            tokens: 1,
            type: "usage",
            reason: "sub_test_p5_restore_check",
            model: "test",
            action: "image_generation",
          });
          return { name: "[P5-3] Restore org plan: generation unblocked", status: "pass", details: "Org unblocked — deduction succeeded ✓" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("Insufficient")) {
            return { name: "[P5-3] Restore org plan: generation unblocked", status: "pass", details: `Org unblocked — "Insufficient credits" (balance=0, expected) ✓` };
          }
          return { name: "[P5-3] Restore org plan: generation unblocked", status: "fail", error: `Unexpected error after restore: ${msg}` };
        }
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 6 — Cycling block
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P6-1] Reset subscription entries (cycling count → 0)", async () => {
        const r = await resetCredits({ companyId });
        return {
          name: "[P6-1] Reset subscription entries (cycling count → 0)",
          status: "pass",
          details: `Cleared ${r.deletedSubscriptionEntries} sub entries. Cycling count reset.`,
        };
      });

      let cyclingTriggered = false;
      await runStep("[P6-2] Trigger cycling block (5 plan changes)", async () => {
        const seq = ["free", "pro_personal", "free", "pro_personal", "free"] as const;
        const log: string[] = [];
        for (let i = 0; i < seq.length; i++) {
          const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: seq[i] });
          if (r.cyclingBlocked) cyclingTriggered = true;
          log.push(`[${i + 1}] → "${seq[i]}" blocked=${r.cyclingBlocked ?? false}`);
          await new Promise((res) => setTimeout(res, 300));
        }
        if (!cyclingTriggered) {
          return {
            name: "[P6-2] Trigger cycling block (5 plan changes)",
            status: "fail",
            error: `cyclingBlocked never set. Log: ${log.join("  ")}`,
          };
        }
        return {
          name: "[P6-2] Trigger cycling block (5 plan changes)",
          status: "pass",
          details: log.join("  "),
        };
      });

      await runStep("[P6-3] Monthly grant paused during cycling window", async () => {
        const r = await ensureMonthlyGrant({ companyId, plan: "free" });
        if (r.granted) {
          return {
            name: "[P6-3] Monthly grant paused during cycling window",
            status: "fail",
            error: `Grant fired (amount=${r.amount}) — cycling block not preventing grant`,
          };
        }
        if (r.reason !== "cycling_blocked") {
          return {
            name: "[P6-3] Monthly grant paused during cycling window",
            status: cyclingTriggered ? "fail" : "skip",
            details: cyclingTriggered
              ? `Expected reason="cycling_blocked", got "${r.reason}"`
              : "Cycling not triggered (P6-2 failed) — skipped",
          };
        }
        return {
          name: "[P6-3] Monthly grant paused during cycling window",
          status: "pass",
          details: `granted=false, reason="cycling_blocked" ✓`,
        };
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 7 — Cleanup & restore
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P7-1] Clear cycling + restore original plan", async () => {
        await resetCredits({ companyId });
        const r = await propagatePlanChange({ ownerUserId: user.id, newPlan: originalPlan });
        // Clear any lapsedAt left on owned workspaces by the test's free-plan
        // simulation steps — propagatePlanChange("free") sets it; this ensures
        // it's fully cleared regardless of originalPlan being "free" or paid.
        const lc = await clearAllLapse({});
        return {
          name: "[P7-1] Clear cycling + restore original plan",
          status: "pass",
          details: `Cycling cleared. plan restored to "${originalPlan}". newBalance=${r.newBalance}. lapse cleared on ${lc.cleared} workspace(s).`,
        };
      });

      await runStep("[P7-2] Delete test org (Clerk)", async () => {
        if (!createdOrgRef.current) {
          return { name: "[P7-2] Delete test org (Clerk)", status: "skip", details: "No test org created" };
        }
        const id = createdOrgRef.current.id;
        try {
          await createdOrgRef.current.destroy();
          createdOrgRef.current = null;
          setPendingCleanupOrgId(null);
          return { name: "[P7-2] Delete test org (Clerk)", status: "pass", details: `Clerk org ${id.slice(0, 18)}… deleted ✓` };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Clerk instance has org deletion disabled — not a code bug, skip cleanly.
          // Convex rows are already cleaned up by P7-3.
          if (msg.toLowerCase().includes("deletion") && msg.toLowerCase().includes("not enabled")) {
            createdOrgRef.current = null;
            setPendingCleanupOrgId(null);
            return {
              name: "[P7-2] Delete test org (Clerk)",
              status: "skip",
              details: `Clerk org deletion is disabled in this instance. Delete "${id.slice(0, 18)}…" manually: Clerk Dashboard → Organizations → ⋯ → Delete. Convex rows already cleaned by P7-3.`,
            };
          }
          return {
            name: "[P7-2] Delete test org (Clerk)",
            status: "fail",
            error: `${msg} — use Manual Cleanup button or delete from Clerk Dashboard.`,
          };
        }
      });

      await runStep("[P7-3] Cleanup test org Convex rows", async () => {
        const orgId = createdOrgId;
        if (!orgId) return { name: "[P7-3] Cleanup test org Convex rows", status: "skip", details: "No test org" };
        try {
          const r = await cleanupTestOrg({ orgId });
          if (!r.deleted) {
            return { name: "[P7-3] Cleanup test org Convex rows", status: "skip", details: `Row not found (reason: ${r.reason})` };
          }
          createdOrgId = null;
          return {
            name: "[P7-3] Cleanup test org Convex rows",
            status: "pass",
            details: `Deleted credits_balance row + ${r.ledgerEntriesRemoved} ledger entries ✓`,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { name: "[P7-3] Cleanup test org Convex rows", status: "fail", error: msg };
        }
      });

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 8 — Free trial limit (3 months × 50 credits cap)
      // Verifies that free grants stop after month 3 and that month 3 still
      // fires correctly when only 2 prior grants exist.
      // ═══════════════════════════════════════════════════════════════════

      await runStep("[P8-1] Reset + seed 3 past free grants", async () => {
        await resetCredits({ companyId });
        const r = await seedFreeGrants({ companyId, count: 3 });
        if (r.seeded !== 3) {
          return { name: "[P8-1] Reset + seed 3 past free grants", status: "fail", error: `Expected seeded=3, got ${r.seeded}` };
        }
        return {
          name: "[P8-1] Reset + seed 3 past free grants",
          status: "pass",
          details: `Cleared ${r.deletedExisting} existing free grant(s). Seeded 3 past-month entries ✓`,
        };
      });

      await runStep("[P8-2] Month 4 attempt → free_trial_months_exhausted", async () => {
        const r = await ensureMonthlyGrant({ companyId, plan: "free" });
        if (r.granted) {
          return {
            name: "[P8-2] Month 4 attempt → free_trial_months_exhausted",
            status: "fail",
            error: `Grant fired (amount=${r.amount}) — 3-month cap not enforced`,
          };
        }
        if (r.reason !== "free_trial_months_exhausted") {
          return {
            name: "[P8-2] Month 4 attempt → free_trial_months_exhausted",
            status: "fail",
            error: `Expected reason="free_trial_months_exhausted", got "${r.reason}"`,
          };
        }
        return {
          name: "[P8-2] Month 4 attempt → free_trial_months_exhausted",
          status: "pass",
          details: `granted=false, reason="free_trial_months_exhausted" ✓`,
        };
      });

      await runStep("[P8-3] Seed 2 past months → month 3 grant succeeds", async () => {
        await resetCredits({ companyId });
        await seedFreeGrants({ companyId, count: 2 });
        const r = await ensureMonthlyGrant({ companyId, plan: "free" });
        if (!r.granted) {
          return {
            name: "[P8-3] Seed 2 past months → month 3 grant succeeds",
            status: "fail",
            error: `Grant blocked (reason="${r.reason}") — should have fired for month 3`,
          };
        }
        if (r.amount !== 50) {
          return {
            name: "[P8-3] Seed 2 past months → month 3 grant succeeds",
            status: "fail",
            error: `Expected amount=50, got ${r.amount}`,
          };
        }
        return {
          name: "[P8-3] Seed 2 past months → month 3 grant succeeds",
          status: "pass",
          details: `granted=true, amount=${r.amount} ✓ (3rd and final free month)`,
        };
      });

    } finally {
      setIsRunning(false);
      const passed = results.filter((r) => r.status === "pass").length;
      const failed = results.filter((r) => r.status === "fail").length;
      const skipped = results.filter((r) => r.status === "skip").length;
      setStatus({
        kind: failed === 0 ? "success" : "error",
        text: `Subscription Lifecycle: ${passed} passed · ${failed} failed · ${skipped} skipped of ${results.length} steps`,
      });
      buildReport(results, originalPlan);
    }
  }

  // ── Manual cleanup (if P7-2 failed or test crashed) ──────────────────

  async function runManualCleanup() {
    if (!pendingCleanupOrgId) return;
    setCleanupBusy(true);
    try {
      if (createdOrgRef.current) {
        await createdOrgRef.current.destroy();
        createdOrgRef.current = null;
      }
      await cleanupTestOrg({ orgId: pendingCleanupOrgId });
      setPendingCleanupOrgId(null);
      setStatus({ kind: "success", text: `Cleanup complete — test org ${pendingCleanupOrgId.slice(0, 16)}… removed.` });
    } catch (err) {
      setStatus({
        kind: "error",
        text: `Cleanup failed: ${err instanceof Error ? err.message : String(err)}. Delete org manually from Clerk Dashboard.`,
      });
    } finally {
      setCleanupBusy(false);
    }
  }

  // ── Report generation ─────────────────────────────────────────────────

  function buildReport(results: TestResult[], originalPlan: string) {
    const now = new Date();
    const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    const skipped = results.filter((r) => r.status === "skip").length;

    const lines: string[] = [
      "# Subscription Lifecycle Test Report",
      "",
      `Generated: ${ts}`,
      `User: ${user?.id?.slice(0, 20) ?? "unknown"}…  |  Plan before test: ${originalPlan}  |  Plan after test: ${effectivePlan}`,
      "",
      "## Summary",
      "",
      `| Result | Count |`,
      `|--------|-------|`,
      `| ✅ Passed | ${passed} |`,
      `| ❌ Failed | ${failed} |`,
      `| ⏭ Skipped | ${skipped} |`,
      `| Total | ${results.length} |`,
      "",
      "## Test Results",
      "",
      "| # | Status | Test | Details / Error | Duration |",
      "|---|--------|------|-----------------|----------|",
      ...results.map((r, i) => {
        const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⏭";
        const msg = (r.error ? `ERROR: ${r.error}` : r.details ?? "").replace(/\|/g, "\\|");
        const dur = r.durationMs !== undefined ? `${r.durationMs}ms` : "—";
        return `| ${i + 1} | ${icon} ${r.status} | ${r.name} | ${msg} | ${dur} |`;
      }),
      "",
      "## What Was Tested",
      "",
      "- **Phase 0** — Identity & plan baseline",
      "- **Phase 1** — Upgrade path: Free → Pro → Business (fresh grant per tier)",
      "- **Phase 2** — Downgrade clawback: Business → Pro → Free (exact credit math)",
      "- **Phase 3** — Test org creation (Clerk + Convex seed)",
      "- **Phase 4** — Org slot enforcement (freeze on downgrade, unfreeze on upgrade)",
      "- **Phase 5** — Org lapse simulation + restore (generation blocking)",
      "- **Phase 6** — Cycling abuse block (5 plan changes → grant pause)",
      "- **Phase 7** — Cleanup & original plan restore",
      "- **Phase 8** — Free trial limit (3×50cr cap: month 4 blocked, month 3 succeeds)",
      "",
      "## System Notes",
      "",
      "- Plan changes use `propagateOwnerPlanChange` (Convex direct — not Stripe/Clerk billing)",
      "- Stripe payment flows are not tested here (require real checkout session)",
      "- Test org is created in Clerk and deleted during Phase 7",
      "- Cycling block is cleared during Phase 7 restore",
      "- All mutations are idempotent — safe to re-run",
      "",
      "---",
      "_Paste this report to Claude to diagnose any failures._",
    ];

    const text = lines.join("\n");
    setReport(text);
    setReportCopied(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => setReportCopied(true)).catch(() => {});
    }
  }

  // ── PDF download (print-window, no extra deps) ────────────────────────

  function downloadPDF() {
    if (!report) return;

    const htmlLines = report.split("\n").map((line) => {
      if (line.startsWith("# ")) return `<h1>${esc(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${esc(line.slice(3))}</h2>`;
      if (line.startsWith("- **")) {
        const [bold, rest] = line.slice(4).split("**");
        return `<li><strong>${esc(bold ?? "")}</strong>${esc(rest ?? "")}</li>`;
      }
      if (line.startsWith("- ")) return `<li>${esc(line.slice(2))}</li>`;
      if (line.startsWith("| ")) {
        if (/^\|[-| ]+\|$/.test(line.trim())) return ""; // separator
        const cells = line
          .split("|")
          .slice(1, -1)
          .map((c) => `<td>${esc(c.trim())}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      }
      if (line === "---") return "<hr>";
      if (line.trim() === "") return `<div style="height:6px"></div>`;
      return `<p>${esc(line)}</p>`;
    });

    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked — allow popups to download PDF.");
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Subscription Lifecycle Test Report</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:920px;margin:36px auto;padding:0 24px 60px;color:#111827;font-size:12.5px;line-height:1.65}
    h1{font-size:20px;font-weight:700;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin:24px 0 14px}
    h2{font-size:14px;font-weight:600;color:#374151;margin:24px 0 8px}
    p{margin:3px 0;color:#374151}
    li{margin:3px 0 3px 20px;color:#374151}
    table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11.5px}
    td{border:1px solid #d1d5db;padding:6px 10px;vertical-align:top;word-break:break-word}
    tr:first-child td{background:#f3f4f6;font-weight:600}
    tr:nth-child(even) td{background:#f9fafb}
    hr{border:none;border-top:1px solid #e5e7eb;margin:18px 0}
    strong{font-weight:600}
    em{font-style:italic;color:#6b7280}
    @media print{
      body{margin:14px auto}
      h2{break-before:auto}
      table{break-inside:avoid}
    }
  </style>
</head>
<body>${htmlLines.join("\n")}</body>
</html>`);
    win.document.close();
    win.onload = () => setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  // ── Render ────────────────────────────────────────────────────────────

  const passed = testResults.filter((r) => r.status === "pass").length;
  const failed = testResults.filter((r) => r.status === "fail").length;
  const skipped = testResults.filter((r) => r.status === "skip").length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Status banner */}
        {status && (
          <div className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
            status.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}>
            {status.kind === "success"
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <div className="flex-1 whitespace-pre-wrap">{status.text}</div>
            <button onClick={() => setStatus(null)} className="text-(--text-tertiary) hover:text-(--text-primary)">×</button>
          </div>
        )}

        {/* Pending cleanup warning */}
        {pendingCleanupOrgId && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm flex items-start gap-2 text-yellow-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <strong>Test org not yet cleaned up</strong> — {pendingCleanupOrgId.slice(0, 18)}…
              <br />
              <span className="text-xs opacity-80">Run the suite again to retry auto-cleanup, or use the button.</span>
            </div>
            <button
              onClick={runManualCleanup}
              disabled={cleanupBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/30 text-xs font-semibold disabled:opacity-50 shrink-0"
            >
              {cleanupBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Manual Cleanup
            </button>
          </div>
        )}

        {/* ── Test runner card ─────────────────────────────────────────── */}
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-(--text-primary)">Subscription Lifecycle Tests</h2>
            </div>
            <button
              onClick={runSubscriptionLifecycleTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {isRunning
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
                : <><Play className="w-4 h-4" /> Run Full Lifecycle Test</>}
            </button>
          </div>

          <p className="text-xs text-(--text-tertiary) mb-5 leading-relaxed">
            Runs <strong className="text-(--text-secondary)">24 automated steps</strong> across 8 phases: upgrade grants,
            downgrade clawbacks, org slot enforcement, lapse &amp; restore, cycling abuse block, cleanup, and free trial limit.
            Plan changes are simulated via <code className="text-purple-300">propagateOwnerPlanChange</code> (no Stripe checkout needed).
            A temporary Clerk org is created and deleted automatically.{" "}
            <strong className="text-yellow-400">Destructive on your personal balance during run — original plan restored at the end.</strong>
          </p>

          {/* Phase legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5 text-[11px]">
            {[
              { label: "P0 Baseline", color: "text-gray-400" },
              { label: "P1 Upgrade", color: "text-emerald-400" },
              { label: "P2 Downgrade", color: "text-orange-400" },
              { label: "P3 Create Org", color: "text-blue-400" },
              { label: "P4 Slot Enforce", color: "text-yellow-400" },
              { label: "P5 Lapse/Restore", color: "text-red-400" },
              { label: "P6 Cycling Block", color: "text-purple-400" },
              { label: "P7 Cleanup", color: "text-teal-400" },
              { label: "P8 Free Trial Limit", color: "text-pink-400" },
            ].map(({ label, color }) => (
              <div key={label} className={`flex items-center gap-1.5 ${color}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {/* Results table */}
          {testResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-2 text-[10px] text-(--text-tertiary) uppercase tracking-wider font-semibold pb-2 border-b border-(--border-primary)">
                <div className="col-span-1">#</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-4">Step</div>
                <div className="col-span-5">Details / Error</div>
                <div className="col-span-1 text-right">ms</div>
              </div>

              {testResults.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-2 text-xs items-start border-b border-(--border-primary)/30 last:border-0">
                  <div className="col-span-1 text-(--text-tertiary) font-mono">{i + 1}</div>
                  <div className="col-span-1 flex justify-center pt-0.5">
                    <ResultIcon status={r.status} />
                  </div>
                  <div className={`col-span-4 ${resultColor(r.status)} font-medium`}>{r.name}</div>
                  <div className="col-span-5 text-(--text-tertiary) wrap-break-word">
                    {r.error
                      ? <span className="text-red-400"><strong>ERROR:</strong> {r.error}</span>
                      : r.details ?? "—"}
                  </div>
                  <div className="col-span-1 text-right text-(--text-tertiary) font-mono">
                    {r.durationMs !== undefined ? r.durationMs : "…"}
                  </div>
                </div>
              ))}

              {!isRunning && testResults.length > 0 && (
                <div className="pt-3 border-t border-(--border-primary) mt-2 flex items-center justify-between text-sm">
                  <span className="text-(--text-secondary)">
                    <span className="text-emerald-400 font-semibold">{passed} passed</span>
                    {" · "}
                    <span className={failed > 0 ? "text-red-400 font-semibold" : "text-(--text-tertiary)"}>{failed} failed</span>
                    {" · "}
                    <span className="text-(--text-tertiary)">{skipped} skipped</span>
                  </span>
                  <span className="text-(--text-tertiary) text-xs font-mono">
                    {testResults.reduce((s, r) => s + (r.durationMs ?? 0), 0)}ms total
                  </span>
                </div>
              )}
            </div>
          )}

          {testResults.length === 0 && !isRunning && (
            <div className="text-center py-10 text-(--text-tertiary) text-sm">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Click <strong className="text-(--text-secondary)">Run Full Lifecycle Test</strong> to begin.
            </div>
          )}
        </div>

        {/* ── Report card ──────────────────────────────────────────────── */}
        {report && (
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-(--text-primary)">Test Report</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(report).then(() => setReportCopied(true));
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {reportCopied ? "Copied!" : "Copy Report"}
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>

            <p className="text-xs text-(--text-tertiary) mb-3">
              Copy this report and paste it into Claude for analysis of any failures.
              PDF opens a print-friendly view — use <strong>Save as PDF</strong> in the print dialog.
            </p>

            <pre className="bg-(--bg-primary) border border-(--border-primary) rounded-lg p-4 text-xs text-(--text-secondary) overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
              {report}
            </pre>
          </div>
        )}

        {/* ── How-to guide ─────────────────────────────────────────────── */}
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-(--text-primary)">How to Run & Interpret</h2>
          </div>
          <div className="space-y-4 text-sm text-(--text-secondary)">
            <div>
              <div className="font-semibold text-(--text-primary) mb-1">Prerequisites</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                <li>Must be in <strong>personal workspace</strong> (not an org) — the test manipulates your personal plan snapshot</li>
                <li>Convex dev server must be running (<code>npm run dev</code>)</li>
                <li>No real Stripe subscription required — plan changes are Convex-level simulations</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-(--text-primary) mb-1">What gets modified (and restored)</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                <li>Your personal <code>credits_balance.ownerPlan</code> — restored at P7-1</li>
                <li>Your personal credit balance — modified during P1/P2, then restored via fresh grant at P7-1</li>
                <li>A temporary Clerk org — created at P3-1, deleted at P7-2</li>
                <li><code>cyclingBlockedUntil</code> — set at P6-2, cleared by reset at P7-1</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-(--text-primary) mb-1">Interpreting SKIP results</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                <li>Phases 3–5 skip if Clerk&apos;s 3-org cap is reached — delete an existing org first</li>
                <li>P6-3 skips if P6-2 failed to trigger the block</li>
                <li>P7-2 skips if no org was created</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-(--text-primary) mb-1">After a failed run</div>
              <ul className="list-disc list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                <li>Use the <strong>Manual Cleanup</strong> banner (if shown) to remove the test org</li>
                <li>Check Clerk Dashboard → Organizations if the org persists</li>
                <li>Go to Credit &amp; Identity tab → <strong>Propagate Current Plan</strong> to restore your snapshot</li>
                <li>Copy and paste the report above to Claude for diagnosis</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

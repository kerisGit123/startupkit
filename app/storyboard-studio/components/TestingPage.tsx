"use client";

import { useState } from "react";
import {
  useUser,
  useOrganizationList,
  useOrganization,
  useAuth,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_LIMITS, CLERK_PLAN_SLUGS } from "@/lib/plan-config";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import {
  FlaskConical,
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
  User as UserIcon,
  Building2,
  Info,
  Copy,
  FileText,
  ClipboardCheck,
  Play,
  XCircle,
  SkipForward,
  Wand2,
  Sparkles,
  BadgePlus,
} from "lucide-react";

interface TestingPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Developer testing page — isolated from production flows.
 *
 * Provides tools to exercise the credit system end-to-end:
 *   - Live view of current balance and recent ledger
 *   - "Reset balance + clear this month's grants" (to retest auto-grant)
 *   - "Force monthly grant" (idempotent check)
 *   - "Seed N credits" (to test deductCredits / transferCredits)
 *   - Subscription + workspace diagnostics panel
 *
 * Remove this page or gate behind an admin check before production.
 */
export function TestingPage({ sidebarOpen, onToggleSidebar }: TestingPageProps) {
  const { user } = useUser();
  const { organization: activeOrg, membership: activeMembership } =
    useOrganization();
  const { has, orgId, orgRole } = useAuth();
  const companyId = useCurrentCompanyId() || "";
  const {
    userPlan,
    orgPlan,
    plan: effectivePlan,
    entitlements,
    isLoading: planLoading,
  } = useSubscription();

  // Clerk permission checks — critical for diagnosing "no billing permission"
  const canManageBilling = has?.({ permission: "org:sys_billing:manage" }) ?? false;
  const canReadMemberships = has?.({ permission: "org:sys_memberships:read" }) ?? false;
  const canManageMemberships = has?.({ permission: "org:sys_memberships:manage" }) ?? false;

  const balance = useQuery(
    api.credits.getBalance,
    companyId ? { companyId } : "skip",
  );
  const ledger = useQuery(
    api.credits.getLedger,
    companyId ? { companyId, limit: 20 } : "skip",
  );
  // ownerPlan snapshot for the current workspace — drives useSubscription
  // in org contexts and should match effectivePlan in personal contexts
  const ownerSnapshot = useQuery(
    api.credits.getOwnerPlan,
    companyId ? { companyId } : "skip",
  );

  const resetCredits = useMutation(api.credits.resetCreditsForTesting);
  const seedCredits = useMutation(api.credits.seedCreditsForTesting);
  const ensureMonthlyGrant = useMutation(api.credits.ensureMonthlyGrant);
  const deductCredits = useMutation(api.credits.deductCredits);
  const cleanupUntyped = useMutation(api.credits.cleanupUntypedLedgerRows);
  const simulateOrgLapse = useMutation(api.credits.simulateOrgLapseForTesting);
  const restoreOrgPlan = useMutation(api.credits.restoreOrgPlanForTesting);
  const propagatePlanChange = useMutation(api.credits.propagateOwnerPlanChange);
  const nuclearReset = useMutation(api.credits.nuclearResetForTesting);

  // Clerk org list — used for "Create Test Org" button and transfer dialog test
  const {
    userMemberships,
    createOrganization,
    setActive,
    isLoaded: orgListLoaded,
  } = useOrganizationList({
    userMemberships: { infinite: true, pageSize: 50 },
  });
  const ownedOrgs =
    orgListLoaded && userMemberships?.data
      ? userMemberships.data.filter(
          (m) => m.role === "org:admin" || m.role === "admin",
        )
      : [];

  const [status, setStatus] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [seedAmount, setSeedAmount] = useState("100");
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  // Automated test runner state
  type TestResult = {
    name: string;
    status: "pass" | "fail" | "skip" | "running" | "pending";
    details?: string;
    error?: string;
    durationMs?: number;
  };
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  async function runReset() {
    setBusy("reset");
    setStatus(null);
    try {
      const result = await resetCredits({ companyId });
      setStatus({
        kind: "success",
        text: `Reset complete. Deleted ${result.deletedSubscriptionEntries} subscription entries. Balance = 0. Refresh the page or wait for auto-grant to fire.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Reset failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runForceGrant() {
    setBusy("grant");
    setStatus(null);
    try {
      const result = await ensureMonthlyGrant({
        companyId,
        plan: effectivePlan,
      });
      if (result.granted) {
        setStatus({
          kind: "success",
          text: `Granted ${result.amount} credits for plan '${effectivePlan}'.`,
        });
      } else {
        setStatus({
          kind: "success",
          text: `Already granted this cycle. No-op (this is correct idempotent behavior).`,
        });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Grant failed",
      });
    } finally {
      setBusy(null);
    }
  }

  // ── Automated test runner ──────────────────────────────────────────
  // Runs through 9 scenarios end-to-end and records pass/fail for each.
  // Uses mutation return values (not reactive queries) to avoid race
  // conditions between mutation commits and query re-subscriptions.
  async function runAllTests() {
    setIsRunningTests(true);
    setStatus(null);

    const results: TestResult[] = [];
    const recordResult = (r: TestResult) => {
      results.push(r);
      setTestResults([...results]);
    };

    const runStep = async (
      name: string,
      fn: () => Promise<TestResult> | TestResult,
    ) => {
      const start = Date.now();
      recordResult({ name, status: "running" });
      try {
        const result = await fn();
        results.pop(); // remove the "running" placeholder
        recordResult({ ...result, durationMs: Date.now() - start });
      } catch (err) {
        results.pop();
        recordResult({
          name,
          status: "fail",
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - start,
        });
      }
    };

    try {
      // ── 1. Identity loaded ──
      await runStep("Identity loaded", () => {
        if (!user?.id) {
          return {
            name: "Identity loaded",
            status: "fail",
            error: "user.id is empty",
          };
        }
        if (!companyId) {
          return {
            name: "Identity loaded",
            status: "fail",
            error: "companyId is empty",
          };
        }
        return {
          name: "Identity loaded",
          status: "pass",
          details: `user=${user.id.slice(0, 12)}…, companyId=${companyId.slice(0, 12)}…`,
        };
      });

      // ── 2. Plan resolved from Clerk ──
      await runStep("Plan resolved from Clerk", () => {
        if (planLoading) {
          return {
            name: "Plan resolved from Clerk",
            status: "fail",
            error: "useSubscription still loading",
          };
        }
        if (!effectivePlan) {
          return {
            name: "Plan resolved from Clerk",
            status: "fail",
            error: "effectivePlan is empty",
          };
        }
        return {
          name: "Plan resolved from Clerk",
          status: "pass",
          details: `userPlan=${userPlan}, orgPlan=${orgPlan ?? "null"}, effective=${effectivePlan}`,
        };
      });

      // ── 3. Plan slug mapping ──
      await runStep("Plan slug mapping valid", () => {
        const slug = CLERK_PLAN_SLUGS[effectivePlan];
        if (!slug) {
          return {
            name: "Plan slug mapping valid",
            status: "fail",
            error: `CLERK_PLAN_SLUGS[${effectivePlan}] is empty`,
          };
        }
        return {
          name: "Plan slug mapping valid",
          status: "pass",
          details: `${effectivePlan} → ${slug}`,
        };
      });

      // ── 4. Entitlements loaded ──
      await runStep("Entitlements loaded", () => {
        if (!entitlements) {
          return {
            name: "Entitlements loaded",
            status: "fail",
            error: "entitlements is undefined",
          };
        }
        if (typeof entitlements.monthlyCredits !== "number") {
          return {
            name: "Entitlements loaded",
            status: "fail",
            error: "monthlyCredits is not a number",
          };
        }
        return {
          name: "Entitlements loaded",
          status: "pass",
          details: `monthlyCredits=${entitlements.monthlyCredits}, maxProjects=${entitlements.maxProjects === Number.MAX_SAFE_INTEGER ? "Infinity" : entitlements.maxProjects}`,
        };
      });

      // ── 5. Reset credits ──
      let resetResult: { deletedSubscriptionEntries: number; newBalance: number } | null = null;
      await runStep("Reset credits to zero", async () => {
        resetResult = await resetCredits({ companyId });
        if (resetResult.newBalance !== 0) {
          return {
            name: "Reset credits to zero",
            status: "fail",
            error: `newBalance=${resetResult.newBalance}, expected 0`,
          };
        }
        return {
          name: "Reset credits to zero",
          status: "pass",
          details: `Deleted ${resetResult.deletedSubscriptionEntries} sub entries, balance=0`,
        };
      });

      // ── 6. Force monthly grant (should succeed) ──
      let firstGrant: { granted: boolean; amount?: number } | null = null;
      await runStep("Force monthly grant (first call)", async () => {
        firstGrant = await ensureMonthlyGrant({
          companyId,
          plan: effectivePlan,
        });
        if (!firstGrant.granted) {
          return {
            name: "Force monthly grant (first call)",
            status: "fail",
            error: `granted=false after reset — expected true`,
          };
        }
        if (firstGrant.amount !== entitlements.monthlyCredits) {
          return {
            name: "Force monthly grant (first call)",
            status: "fail",
            error: `amount=${firstGrant.amount}, expected ${entitlements.monthlyCredits}`,
          };
        }
        return {
          name: "Force monthly grant (first call)",
          status: "pass",
          details: `Granted ${firstGrant.amount} credits`,
        };
      });

      // ── 7. Idempotent second grant ──
      await runStep("Force monthly grant (second call is no-op)", async () => {
        const secondGrant = await ensureMonthlyGrant({
          companyId,
          plan: effectivePlan,
        });
        if (secondGrant.granted) {
          return {
            name: "Force monthly grant (second call is no-op)",
            status: "fail",
            error: `granted=true on second call — expected false (not idempotent)`,
          };
        }
        return {
          name: "Force monthly grant (second call is no-op)",
          status: "pass",
          details: `granted=false (idempotent behavior verified)`,
        };
      });

      // ── 8. Seed credits ──
      await runStep("Seed 50 credits for testing", async () => {
        const seedResult = await seedCredits({ amount: 50, companyId });
        if (seedResult.added !== 50) {
          return {
            name: "Seed 50 credits for testing",
            status: "fail",
            error: `added=${seedResult.added}, expected 50`,
          };
        }
        return {
          name: "Seed 50 credits for testing",
          status: "pass",
          details: `Added 50 credits as admin_adjustment`,
        };
      });

      // ── 9. Transfer dialog gating sanity ──
      await runStep("Transfer gating matches plan", () => {
        const canCreate = entitlements.canCreateOrg;
        if (effectivePlan === "free" && canCreate) {
          return {
            name: "Transfer gating matches plan",
            status: "fail",
            error: `Free plan should have canCreateOrg=false`,
          };
        }
        if (effectivePlan === "business" && !canCreate) {
          return {
            name: "Transfer gating matches plan",
            status: "fail",
            error: `Business plan should have canCreateOrg=true`,
          };
        }
        return {
          name: "Transfer gating matches plan",
          status: "pass",
          details: `canCreateOrg=${canCreate} for plan '${effectivePlan}'`,
        };
      });

      // ── 10. Simulated deductCredits ──
      await runStep("Simulated deductCredits (-10)", async () => {
        try {
          await deductCredits({
            companyId,
            tokens: 10,
            type: "usage",
            reason: "test_runner_simulate",
            model: "test-model",
            action: "image_generation",
            plan: effectivePlan,
          });
          return {
            name: "Simulated deductCredits (-10)",
            status: "pass",
            details: `Deducted 10 credits with type='usage'. Ledger should now have a new usage entry.`,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("Insufficient")) {
            return {
              name: "Simulated deductCredits (-10)",
              status: "fail",
              error: "Insufficient credits — deducted amount exceeded balance",
            };
          }
          throw err;
        }
      });

      // ── 11. Transfer dialog state (workspace count) ──
      await runStep("Transfer dialog workspace count", () => {
        if (!orgListLoaded) {
          return {
            name: "Transfer dialog workspace count",
            status: "skip",
            details: "Clerk org list still loading — skipped",
          };
        }
        const workspaceCount = 1 + ownedOrgs.length; // 1 personal + N owned orgs
        const expectedState =
          workspaceCount < 2 ? "warning_shown" : "dropdowns_shown";
        return {
          name: "Transfer dialog workspace count",
          status: "pass",
          details: `${workspaceCount} workspaces (1 personal + ${ownedOrgs.length} owned orgs) → dialog state: ${expectedState}`,
        };
      });

      // ── 12. Active org context (skipped if no active org or no org plan) ──
      await runStep("Active org context detection", () => {
        if (!orgListLoaded) {
          return {
            name: "Active org context detection",
            status: "skip",
            details: "Clerk org list still loading",
          };
        }
        if (!orgId) {
          return {
            name: "Active org context detection",
            status: "skip",
            details: `No active organization. Switch to an org via OrgSwitcher or click "Create Test Org" to create one.`,
          };
        }
        if (orgPlan === null) {
          return {
            name: "Active org context detection",
            status: "skip",
            details: `Active org "${activeOrg?.name ?? orgId.slice(0, 12)}" exists but has no subscribed plan. Subscribe to Starter Team or Business via Billing → Plans → Organization to test this path.`,
          };
        }
        return {
          name: "Active org context detection",
          status: "pass",
          details: `Active org plan='${orgPlan}' overrides personal plan='${userPlan}'`,
        };
      });

      // ── 13. Owner plan snapshot consistency ──
      await runStep("Owner plan snapshot consistency", () => {
        if (ownerSnapshot === undefined) {
          return {
            name: "Owner plan snapshot consistency",
            status: "skip",
            details: "Snapshot query still loading",
          };
        }
        if (!ownerSnapshot || !ownerSnapshot.ownerPlan) {
          return {
            name: "Owner plan snapshot consistency",
            status: "fail",
            error: `No ownerPlan snapshot for ${companyId.slice(0, 12)}… — webhook may not have run, or this workspace predates the snapshot system. Create a new org or trigger a subscription event to populate.`,
          };
        }
        if (ownerSnapshot.ownerPlan !== effectivePlan) {
          return {
            name: "Owner plan snapshot consistency",
            status: "fail",
            error: `Snapshot='${ownerSnapshot.ownerPlan}' but effectivePlan='${effectivePlan}'. Propagation webhook may not have fired for the latest subscription change.`,
          };
        }
        return {
          name: "Owner plan snapshot consistency",
          status: "pass",
          details: `Snapshot matches effectivePlan ('${ownerSnapshot.ownerPlan}'), creatorUserId=${ownerSnapshot.creatorUserId?.slice(0, 12) ?? "?"}…`,
        };
      });

      // ── 14. Clerk billing permission (critical for org plan subscription) ──
      await runStep("Clerk billing permission", () => {
        if (!orgId) {
          return {
            name: "Clerk billing permission",
            status: "skip",
            details: `No active org context. Billing permission only applies to org plans — personal workspace uses user plans which are subscribed directly via the pricing table.`,
          };
        }
        if (!canManageBilling) {
          return {
            name: "Clerk billing permission",
            status: "fail",
            error: `Your role '${orgRole ?? "unknown"}' does NOT have org:sys_billing:manage permission. Subscribe will fail. Check Clerk Dashboard → Organizations → Roles & Permissions.`,
          };
        }
        return {
          name: "Clerk billing permission",
          status: "pass",
          details: `Role '${orgRole}' has org:sys_billing:manage — org plan subscription should work.`,
        };
      });
    } finally {
      setIsRunningTests(false);
      const passed = results.filter((r) => r.status === "pass").length;
      const failed = results.filter((r) => r.status === "fail").length;
      setStatus({
        kind: failed === 0 ? "success" : "error",
        text: `Tests complete: ${passed} passed, ${failed} failed out of ${results.length}`,
      });
    }
  }

  function generateReport() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;

    const lines: string[] = [];
    lines.push("# Storytica Testing Report");
    lines.push(`Generated: ${timestamp}`);
    lines.push("");
    lines.push("## Identity");
    lines.push(`- User ID: \`${user?.id ?? "(unknown)"}\``);
    lines.push(`- User email: ${user?.primaryEmailAddress?.emailAddress ?? "(none)"}`);
    lines.push(`- Active companyId: \`${companyId || "(empty)"}\``);
    lines.push(`- Is personal workspace: ${companyId === user?.id ? "yes" : "no"}`);
    lines.push("");
    lines.push("## Subscription (from Clerk has + ownerPlan snapshot)");
    lines.push(`- userPlan: \`${userPlan}\``);
    lines.push(`- orgPlan (from snapshot): \`${orgPlan ?? "null"}\``);
    lines.push(`- Effective plan: \`${effectivePlan}\``);
    lines.push(`- Is loading: ${planLoading}`);
    lines.push("");
    lines.push("## Owner Plan Snapshot (credits_balance)");
    if (ownerSnapshot === undefined) {
      lines.push("_loading…_");
    } else if (!ownerSnapshot || !ownerSnapshot.ownerPlan) {
      lines.push(`- ⚠️ No snapshot for \`${companyId}\``);
    } else {
      lines.push(`- ownerPlan: \`${ownerSnapshot.ownerPlan}\``);
      lines.push(`- creatorUserId: \`${ownerSnapshot.creatorUserId ?? "(not set)"}\``);
      lines.push(
        `- Matches effectivePlan: ${ownerSnapshot.ownerPlan === effectivePlan ? "✅ yes" : "❌ NO"}`,
      );
    }
    lines.push("");
    lines.push("## Clerk Session & Permissions");
    lines.push(`- Active Clerk org ID: \`${orgId ?? "(none - personal workspace)"}\``);
    lines.push(`- Active org name: ${activeOrg?.name ?? "—"}`);
    lines.push(`- Role in active org: \`${orgRole ?? "—"}\``);
    lines.push(`- Can manage billing: ${!orgId ? "n/a (no active org)" : canManageBilling ? "✅ yes" : "❌ NO"}`);
    lines.push(`- Can read memberships: ${!orgId ? "n/a" : canReadMemberships ? "yes" : "no"}`);
    lines.push(`- Can manage memberships: ${!orgId ? "n/a" : canManageMemberships ? "yes" : "no"}`);
    lines.push(`- Owned orgs count: ${ownedOrgs.length}`);
    if (ownedOrgs.length > 0) {
      for (const m of ownedOrgs) {
        lines.push(`  - \`${m.organization.id}\` "${m.organization.name}" (role: ${m.role})`);
      }
    }
    lines.push("");
    lines.push("## Plan slug mapping (env vars)");
    lines.push(`- free → \`${CLERK_PLAN_SLUGS.free}\``);
    lines.push(`- pro_personal → \`${CLERK_PLAN_SLUGS.pro_personal}\``);
    lines.push(`- starter → \`${CLERK_PLAN_SLUGS.starter}\``);
    lines.push(`- business → \`${CLERK_PLAN_SLUGS.business}\``);
    lines.push("");
    lines.push("## Entitlements (from PLAN_LIMITS[effectivePlan])");
    lines.push(`- canCreateOrg: ${entitlements.canCreateOrg}`);
    lines.push(`- maxOrgs: ${entitlements.maxOrgs}`);
    lines.push(`- maxMembersPerOrg: ${entitlements.maxMembersPerOrg}`);
    lines.push(`- maxProjects: ${entitlements.maxProjects === Number.MAX_SAFE_INTEGER ? "Infinity" : entitlements.maxProjects}`);
    lines.push(`- monthlyCredits: ${entitlements.monthlyCredits}`);
    lines.push(`- storageMB: ${entitlements.storageMB}`);
    lines.push("");
    lines.push("## Credit Balance");
    lines.push(`- Current balance: **${balance === undefined ? "loading…" : balance.toLocaleString()}**`);
    lines.push("");
    lines.push("## Recent Ledger (last 20)");
    if (!ledger) {
      lines.push("_loading…_");
    } else if (ledger.length === 0) {
      lines.push("_no entries_");
    } else {
      lines.push("| Type | Tokens | Reason | Created |");
      lines.push("|---|---|---|---|");
      for (const row of ledger) {
        const created = new Date(row.createdAt).toISOString().slice(0, 19) + "Z";
        const type = row.type ?? "(untyped)";
        const reason = (row.reason ?? "—").replace(/\|/g, "\\|");
        const userIdShort = row.userId ? ` [${row.userId.slice(0, 8)}]` : "";
        lines.push(`| \`${type}\` | ${row.tokens > 0 ? "+" : ""}${row.tokens} | ${reason}${userIdShort} | ${created} |`);
      }
    }
    lines.push("");
    lines.push("## Ledger summary by type");
    if (ledger && ledger.length > 0) {
      const byType: Record<string, { count: number; sum: number }> = {};
      for (const row of ledger) {
        const t = row.type ?? "(untyped)";
        if (!byType[t]) byType[t] = { count: 0, sum: 0 };
        byType[t].count++;
        byType[t].sum += row.tokens;
      }
      lines.push("| Type | Count | Sum tokens |");
      lines.push("|---|---|---|");
      for (const [t, { count, sum }] of Object.entries(byType)) {
        lines.push(`| \`${t}\` | ${count} | ${sum > 0 ? "+" : ""}${sum} |`);
      }
    }
    lines.push("");
    lines.push("## Environment");
    lines.push(`- User agent: ${typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "(ssr)"}`);
    lines.push(`- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    lines.push(`- Local time: ${now.toLocaleString()}`);
    lines.push("");
    lines.push("## Expected vs actual");
    const expected = entitlements.monthlyCredits;
    const hasSubThisMonth = ledger?.some((r) => {
      if (r.type !== "subscription") return false;
      const d = new Date(r.createdAt);
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
    });
    lines.push(`- Expected monthly grant (for ${effectivePlan}): ${expected}`);
    lines.push(`- Subscription entry for current month: ${hasSubThisMonth ? "✅ yes" : "❌ no"}`);
    lines.push(`- Balance sanity: ${balance !== undefined && balance >= 0 ? "✅ non-negative" : "❌ negative or loading"}`);
    lines.push("");
    lines.push("## Automated Test Results");
    if (testResults.length === 0) {
      lines.push("_No tests run yet. Click 'Run All Tests' before generating the report for full diagnostics._");
    } else {
      const passed = testResults.filter((r) => r.status === "pass").length;
      const failed = testResults.filter((r) => r.status === "fail").length;
      lines.push(`**Summary:** ${passed} passed, ${failed} failed, ${testResults.length} total`);
      lines.push("");
      lines.push("| # | Status | Test | Details / Error | Duration |");
      lines.push("|---|---|---|---|---|");
      testResults.forEach((r, i) => {
        const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : r.status === "skip" ? "⏭" : "⏳";
        const msg = r.error ? `**ERROR:** ${r.error}` : r.details ?? "";
        const dur = r.durationMs !== undefined ? `${r.durationMs}ms` : "—";
        lines.push(`| ${i + 1} | ${icon} ${r.status} | ${r.name} | ${msg.replace(/\|/g, "\\|")} | ${dur} |`);
      });
    }
    lines.push("");
    lines.push("---");
    lines.push("_Paste this whole report to Claude for analysis._");

    const text = lines.join("\n");
    setReportText(text);
    setReportCopied(false);

    // Try clipboard auto-copy
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => setReportCopied(true))
        .catch(() => {});
    }
  }

  async function runSeed() {
    const amount = Number(seedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus({ kind: "error", text: "Amount must be a positive number" });
      return;
    }
    setBusy("seed");
    setStatus(null);
    try {
      const result = await seedCredits({ amount, companyId });
      setStatus({
        kind: "success",
        text: `Seeded ${result.added} credits to ${result.companyId.slice(0, 12)}…`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Seed failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runSimulateGeneration() {
    setBusy("simulate");
    setStatus(null);
    try {
      await deductCredits({
        companyId,
        tokens: 10,
        type: "usage",
        reason: "test_simulate_generation",
        model: "test-model",
        action: "image_generation",
        plan: effectivePlan,
      });
      setStatus({
        kind: "success",
        text: `Simulated AI generation: deducted 10 credits. Check ledger for a new 'usage' entry.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Simulate failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runCleanupUntyped() {
    setBusy("cleanup");
    setStatus(null);
    try {
      const result = await cleanupUntyped({ companyId });
      setStatus({
        kind: "success",
        text: `Cleanup complete. Scanned ${result.scanned} rows, found ${result.untypedFound} untyped, patched ${result.patchedAsUsage} as 'usage', skipped ${result.skippedUnknown}.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Cleanup failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runNuclearReset() {
    if (!user?.id) {
      setStatus({ kind: "error", text: "No user ID" });
      return;
    }

    // Double-confirm — this is truly destructive
    const confirmed = window.confirm(
      "NUCLEAR RESET: This will permanently delete ALL your data:\n\n" +
        "• R2 files (Cloudflare storage)\n" +
        "• storyboard_files (metadata)\n" +
        "• storyboard_elements\n" +
        "• storyboard_items\n" +
        "• storyboard_projects\n" +
        "• credits_balance\n" +
        "• credits_ledger\n\n" +
        "For your personal workspace AND all orgs you created.\n\n" +
        "Clerk (user account, orgs, subscription) is NOT affected.\n" +
        "Delete those manually from Clerk Dashboard after.\n\n" +
        "Are you sure?",
    );
    if (!confirmed) return;

    setBusy("nuclear");
    setStatus(null);
    try {
      const response = await fetch("/api/testing/nuclear-reset", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nuclear reset failed");

      const d = result.convexDeleted || {};
      const lines = [
        `R2: deleted ${result.r2DeletedCount} files, ${result.r2FailedCount} failed`,
        `Convex: ${d.storyboard_files ?? 0} files, ${d.storyboard_elements ?? 0} elements, ${d.storyboard_items ?? 0} items, ${d.storyboard_projects ?? 0} projects, ${d.credits_balance ?? 0} balance, ${d.credits_ledger ?? 0} ledger`,
        `Workspaces cleaned: ${(result.companyIds || []).length}`,
      ];
      if (result.errors?.length > 0) {
        lines.push(`Errors: ${result.errors.join("; ")}`);
      }
      lines.push("Now delete your orgs + user from Clerk Dashboard → re-register.");

      setStatus({ kind: "success", text: lines.join("\n") });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Nuclear reset failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runResetToFree() {
    if (!user?.id) {
      setStatus({ kind: "error", text: "No user ID available" });
      return;
    }
    setBusy("resetFree");
    setStatus(null);
    try {
      const result = await propagatePlanChange({
        ownerUserId: user.id,
        newPlan: "free",
      });
      setStatus({
        kind: "success",
        text: `Reset to Free: updated ${result.updated} of ${result.totalOwned} workspaces. Personal + all owned orgs now show ownerPlan="free". Orgs will show LapsedBanner. Your Clerk subscription is unchanged — this is a snapshot override for testing.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Reset failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runPropagateCurrentPlan() {
    if (!user?.id) {
      setStatus({ kind: "error", text: "No user ID available" });
      return;
    }
    setBusy("propagate");
    setStatus(null);
    try {
      const result = await propagatePlanChange({
        ownerUserId: user.id,
        newPlan: userPlan,
      });
      setStatus({
        kind: "success",
        text: `Propagated "${userPlan}" to ${result.updated} of ${result.totalOwned} workspaces. This syncs the snapshot to match your actual Clerk subscription.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Propagate failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runSimulateOrgLapse() {
    if (!companyId || !companyId.startsWith("org_")) {
      setStatus({
        kind: "error",
        text: "Switch to an org context first (not personal workspace)",
      });
      return;
    }
    setBusy("lapse");
    setStatus(null);
    try {
      await simulateOrgLapse({ companyId });
      setStatus({
        kind: "success",
        text: `Simulated lapse: ownerPlan set to "free", lapsedAt set to now. The LapsedBanner should appear after refresh.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Simulate lapse failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runRestoreOrgPlan() {
    if (!companyId || !companyId.startsWith("org_")) {
      setStatus({
        kind: "error",
        text: "Switch to an org context first (not personal workspace)",
      });
      return;
    }
    setBusy("restore");
    setStatus(null);
    try {
      // Restore the org's plan to match the current user's personal Clerk plan
      await restoreOrgPlan({ companyId, plan: userPlan });
      setStatus({
        kind: "success",
        text: `Restored: ownerPlan set to "${userPlan}", lapsedAt cleared. The LapsedBanner should disappear after refresh.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "Restore failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runCreateTestOrg() {
    if (!createOrganization || !setActive) {
      setStatus({ kind: "error", text: "Clerk org API not loaded yet" });
      return;
    }
    setBusy("createOrg");
    setStatus(null);
    try {
      const orgName = `Test Org ${new Date().toISOString().slice(5, 16).replace("T", " ")}`;
      const org = await createOrganization({ name: orgName });
      // Switch context to the new org immediately
      await setActive({ organization: org.id });
      setStatus({
        kind: "success",
        text: `Created "${org.name}" (${org.id.slice(0, 12)}…) and switched to it. You can now subscribe this org to Starter Team via Billing & Subscription.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create org failed";
      // Common Clerk errors to translate
      const friendly = message.includes("maximum")
        ? "Max orgs reached for this user (Clerk instance cap is 3). Delete an existing org first."
        : message;
      setStatus({ kind: "error", text: friendly });
    } finally {
      setBusy(null);
    }
  }

  const ledgerTypeColors: Record<string, string> = {
    org_created: "text-gray-400",
    purchase: "text-emerald-400",
    subscription: "text-blue-400",
    usage: "text-yellow-400",
    refund: "text-purple-400",
    transfer_out: "text-red-400",
    transfer_in: "text-emerald-400",
    admin_adjustment: "text-orange-400",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-(--bg-primary)">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--text-primary)">
              Testing
            </h1>
            <p className="text-xs text-(--text-tertiary)">
              Developer tools for testing the credit and plan system
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrgSwitcher />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status banner */}
          {status && (
            <div
              className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
                status.kind === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {status.kind === "success" ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">{status.text}</div>
              <button
                onClick={() => setStatus(null)}
                className="text-(--text-tertiary) hover:text-(--text-primary)"
              >
                ×
              </button>
            </div>
          )}

          {/* Diagnostics */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-(--text-primary)">
                Diagnostics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DiagRow label="User ID" value={user?.id} copyable />
              <DiagRow label="Active companyId" value={companyId} copyable />
              <DiagRow
                label="User plan (from has)"
                value={planLoading ? "loading…" : userPlan}
              />
              <DiagRow
                label="Org plan (from has)"
                value={planLoading ? "loading…" : orgPlan ?? "—"}
              />
              <DiagRow
                label="Effective plan"
                value={planLoading ? "loading…" : effectivePlan}
              />
              <DiagRow
                label="Clerk slug (for has check)"
                value={CLERK_PLAN_SLUGS[effectivePlan] ?? "?"}
              />
              <DiagRow
                label="Max projects"
                value={String(entitlements.maxProjects)}
              />
              <DiagRow
                label="Monthly credits allowance"
                value={entitlements.monthlyCredits.toLocaleString()}
              />
              <DiagRow
                label="Can create orgs"
                value={entitlements.canCreateOrg ? "yes" : "no"}
              />
              <DiagRow
                label="Max members per org"
                value={String(entitlements.maxMembersPerOrg)}
              />
            </div>

            {/* Owner plan snapshot — the source of truth for inherited features */}
            <div className="mt-4 pt-4 border-t border-(--border-primary)">
              <div className="text-xs text-(--text-tertiary) mb-2 uppercase tracking-wider font-semibold">
                Owner Plan Snapshot (current workspace)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <DiagRow
                  label="Snapshot ownerPlan"
                  value={
                    ownerSnapshot === undefined
                      ? "loading…"
                      : ownerSnapshot?.ownerPlan ?? "(not set)"
                  }
                />
                <DiagRow
                  label="Snapshot creatorUserId"
                  value={
                    ownerSnapshot === undefined
                      ? "loading…"
                      : ownerSnapshot?.creatorUserId ?? "(not set)"
                  }
                  copyable={!!ownerSnapshot?.creatorUserId}
                />
              </div>
              {ownerSnapshot &&
                ownerSnapshot.ownerPlan &&
                ownerSnapshot.ownerPlan !== effectivePlan && (
                  <div className="mt-2 p-2 rounded border border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-300">
                    <strong>Mismatch:</strong> snapshot says{" "}
                    <code>{ownerSnapshot.ownerPlan}</code> but useSubscription
                    returned <code>{effectivePlan}</code>. This means the
                    snapshot propagation isn&apos;t up to date — check the
                    Clerk webhook for subscription events.
                  </div>
                )}
            </div>
          </div>

          {/* Clerk Session & Permissions */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-(--text-primary)">
                Clerk Session &amp; Permissions
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DiagRow
                label="Active Clerk org ID"
                value={orgId ?? "(personal workspace)"}
                copyable={!!orgId}
              />
              <DiagRow
                label="Active org name"
                value={activeOrg?.name ?? "—"}
              />
              <DiagRow label="Your role in org" value={orgRole ?? "—"} />
              <DiagRow
                label="Membership permissions"
                value={
                  activeMembership?.permissions?.length
                    ? `${activeMembership.permissions.length} perms`
                    : "—"
                }
              />
              <DiagRow
                label="Can manage billing"
                value={
                  !orgId ? "n/a (no active org)" : canManageBilling ? "✅ yes" : "❌ NO"
                }
              />
              <DiagRow
                label="Can read memberships"
                value={!orgId ? "n/a" : canReadMemberships ? "yes" : "no"}
              />
              <DiagRow
                label="Can manage memberships"
                value={!orgId ? "n/a" : canManageMemberships ? "yes" : "no"}
              />
              <DiagRow
                label="Owned orgs count"
                value={String(ownedOrgs.length)}
              />
            </div>
            {orgId && !canManageBilling && (
              <div className="mt-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Clerk says you can&apos;t manage billing for this org.</strong>
                    <br />
                    Your role is <code className="text-red-200">{orgRole ?? "unknown"}</code>. In
                    Clerk Dashboard → Organizations → Roles &amp; Permissions,
                    verify the role has <code className="text-red-200">org:sys_billing:manage</code>{" "}
                    permission assigned. The default <code>org:admin</code> role
                    includes it, but custom roles may not.
                  </div>
                </div>
              </div>
            )}
            {!orgId && (
              <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>No active organization.</strong> You&apos;re in personal
                    workspace mode. You cannot subscribe to an Organization
                    Plan (Starter Team, Business) without first creating or
                    switching to an org. Use &quot;Create Test Org&quot; above,
                    then verify the org name appears in the top-right
                    OrgSwitcher, THEN go to Billing &amp; Subscription → Plans →
                    Organization tab → Subscribe.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Credit balance */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-(--text-primary)">
                  Credit Balance
                </h2>
              </div>
              <div className="text-2xl font-bold text-(--text-primary)">
                {balance === undefined ? "…" : balance.toLocaleString()}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={runReset}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "reset" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Reset to 0 + Clear Grants
              </button>

              <button
                onClick={runForceGrant}
                disabled={busy !== null}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "grant" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Force Monthly Grant
              </button>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={seedAmount}
                  onChange={(e) => setSeedAmount(e.target.value)}
                  className="w-20 px-3 py-3 rounded-lg bg-(--bg-primary) border border-(--border-primary) text-(--text-primary) text-sm focus:outline-none focus:border-(--accent-blue)"
                  placeholder="100"
                />
                <button
                  onClick={runSeed}
                  disabled={busy !== null}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {busy === "seed" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Seed
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-(--text-tertiary)">
              <strong>Reset</strong> deletes this month's subscription grant
              ledger entries so the auto-grant on next page load will fire
              fresh. <strong>Force Grant</strong> triggers
              ensureMonthlyGrant once (idempotent). <strong>Seed</strong> adds
              credits as an admin adjustment for testing deductCredits.
            </p>
          </div>

          {/* Plan Override (for testing subscription flows) */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-(--text-primary)">
                Plan Override (Testing)
              </h2>
            </div>
            <p className="text-xs text-(--text-tertiary) mb-3">
              Override your ownerPlan snapshot without touching Clerk.
              <strong className="text-(--text-primary)"> Reset to Free</strong> makes all your
              workspaces (personal + orgs) behave as Free tier.
              <strong className="text-(--text-primary)"> Sync from Clerk</strong> restores
              the snapshot to match your actual Clerk subscription.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={runResetToFree}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "resetFree" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Reset All to Free
              </button>

              <button
                onClick={runPropagateCurrentPlan}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "propagate" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Sync from Clerk ({userPlan})
              </button>

              <button
                onClick={runNuclearReset}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {busy === "nuclear" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Nuclear Reset (Wipe All)
              </button>
            </div>
            <p className="mt-2 text-[10px] text-(--text-tertiary)">
              <strong className="text-red-300">Nuclear Reset</strong> deletes
              ALL credit data (balance + ledger) for your personal workspace
              and all owned orgs. Use before deleting your user in Clerk
              Dashboard for a completely fresh start.
            </p>
          </div>

          {/* Advanced Actions */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-bold text-(--text-primary)">
                Advanced Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={runSimulateGeneration}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "simulate" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Simulate AI Gen (-10)
              </button>

              <button
                onClick={runCleanupUntyped}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "cleanup" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Cleanup Untyped Rows
              </button>

              <button
                onClick={runCreateTestOrg}
                disabled={busy !== null || isRunningTests}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "createOrg" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BadgePlus className="w-4 h-4" />
                )}
                Create Test Org
              </button>
            </div>

            {/* Second row: org lifecycle simulation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <button
                onClick={runSimulateOrgLapse}
                disabled={
                  busy !== null ||
                  isRunningTests ||
                  !companyId?.startsWith("org_")
                }
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "lapse" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                Simulate Org Lapse
              </button>

              <button
                onClick={runRestoreOrgPlan}
                disabled={
                  busy !== null ||
                  isRunningTests ||
                  !companyId?.startsWith("org_")
                }
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {busy === "restore" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Restore Org Plan
              </button>
            </div>
            <p className="mt-3 text-xs text-(--text-tertiary)">
              <strong>Simulate AI Gen</strong> calls deductCredits with
              type=&quot;usage&quot; to test the deduct flow without spending
              real Kie credits. <strong>Cleanup Untyped Rows</strong> backfills{" "}
              <code>type: &quot;usage&quot;</code> on legacy ledger entries from
              before the schema change. <strong>Create Test Org</strong>{" "}
              bypasses the UI &quot;Create organization&quot; hide by calling
              Clerk&apos;s API directly — lets you test org flows and subscribe
              to Starter Team even as a Free user (subject to Clerk&apos;s 3-org
              instance cap).
            </p>

            {/* Owned orgs display */}
            {orgListLoaded && (
              <div className="mt-4 pt-4 border-t border-(--border-primary)">
                <div className="text-xs text-(--text-tertiary) mb-2">
                  Your owned organizations ({ownedOrgs.length}):
                </div>
                {ownedOrgs.length === 0 ? (
                  <div className="text-xs text-(--text-secondary) italic">
                    None. Click &quot;Create Test Org&quot; to make one.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {ownedOrgs.map((m) => (
                      <div
                        key={m.organization.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="text-(--text-primary)">
                          {m.organization.name}
                        </span>
                        <span className="text-(--text-tertiary) font-mono">
                          {m.organization.id.slice(0, 16)}…
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Automated Test Runner */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-(--text-primary)">
                  Automated Test Runner
                </h2>
              </div>
              <button
                onClick={runAllTests}
                disabled={isRunningTests || busy !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {isRunningTests ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run All Tests
              </button>
            </div>
            <p className="text-xs text-(--text-tertiary) mb-4">
              Runs 14 scenarios end-to-end: identity → plan → slug →
              entitlements → reset → grant → idempotent grant → seed → gating →
              simulated deduct → transfer dialog state → org context → owner
              snapshot consistency → billing permission. Uses mutation return values to avoid race conditions.
              <strong className="text-(--text-primary)"> Note:</strong> this
              will reset your credits balance and leave it at (monthly grant + 50 seed − 10 simulated deduct).
            </p>

            {testResults.length > 0 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-(--text-tertiary) uppercase tracking-wider font-semibold pb-2 border-b border-(--border-primary)">
                  <div className="col-span-1">#</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-4">Test</div>
                  <div className="col-span-5">Details / Error</div>
                  <div className="col-span-1 text-right">Time</div>
                </div>
                {testResults.map((r, i) => {
                  const icon = r.status === "pass" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : r.status === "fail" ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : r.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : r.status === "skip" ? (
                    <SkipForward className="w-4 h-4 text-gray-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  );
                  const textColor =
                    r.status === "pass"
                      ? "text-emerald-300"
                      : r.status === "fail"
                      ? "text-red-300"
                      : "text-(--text-secondary)";
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 py-2 text-xs items-start"
                    >
                      <div className="col-span-1 text-(--text-tertiary) font-mono">
                        {i + 1}
                      </div>
                      <div className="col-span-1 flex justify-center pt-0.5">
                        {icon}
                      </div>
                      <div className={`col-span-4 ${textColor}`}>
                        {r.name}
                      </div>
                      <div className="col-span-5 text-(--text-tertiary) wrap-break-word">
                        {r.error ? (
                          <span className="text-red-400">
                            <strong>ERROR:</strong> {r.error}
                          </span>
                        ) : (
                          r.details ?? "—"
                        )}
                      </div>
                      <div className="col-span-1 text-right text-(--text-tertiary) font-mono">
                        {r.durationMs !== undefined ? `${r.durationMs}ms` : "…"}
                      </div>
                    </div>
                  );
                })}

                {/* Summary row */}
                {!isRunningTests && testResults.length > 0 && (
                  <div className="pt-3 border-t border-(--border-primary) mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--text-secondary)">
                        {testResults.filter((r) => r.status === "pass").length} passed,{" "}
                        {testResults.filter((r) => r.status === "fail").length} failed
                      </span>
                      <span className="text-(--text-tertiary) text-xs">
                        Total:{" "}
                        {testResults.reduce((sum, r) => sum + (r.durationMs ?? 0), 0)}ms
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ledger */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <h2 className="text-lg font-bold text-(--text-primary) mb-4">
              Recent Ledger Entries
            </h2>
            {!ledger ? (
              <div className="text-(--text-tertiary) text-sm">Loading…</div>
            ) : ledger.length === 0 ? (
              <div className="text-(--text-tertiary) text-sm">
                No ledger entries yet for {companyId.slice(0, 12)}…
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-(--text-tertiary) uppercase tracking-wider font-semibold pb-2 border-b border-(--border-primary)">
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2 text-right">Tokens</div>
                  <div className="col-span-4">Reason</div>
                  <div className="col-span-3 text-right">Created</div>
                </div>
                {ledger.map((row) => (
                  <div
                    key={row._id}
                    className="grid grid-cols-12 gap-2 py-2 text-xs border-b border-(--border-primary)/50 last:border-0"
                  >
                    <div
                      className={`col-span-3 font-mono ${ledgerTypeColors[row.type ?? ""] ?? "text-gray-400"}`}
                    >
                      {row.type ?? "(untyped)"}
                    </div>
                    <div
                      className={`col-span-2 text-right font-mono ${
                        row.tokens < 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {row.tokens > 0 ? "+" : ""}
                      {row.tokens.toLocaleString()}
                    </div>
                    <div className="col-span-4 text-(--text-secondary) truncate">
                      {row.reason ?? "—"}
                    </div>
                    <div className="col-span-3 text-right text-(--text-tertiary) font-mono">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Report */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-(--text-primary)">
                  Generate Report
                </h2>
              </div>
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 transition-colors text-sm font-semibold"
              >
                <FileText className="w-4 h-4" />
                Generate
              </button>
            </div>
            <p className="text-xs text-(--text-tertiary) mb-3">
              Snapshots your current state (identity, plan, entitlements,
              ledger, balance) as a markdown report. Auto-copied to clipboard.
              Paste the full report to Claude for faster debugging.
            </p>

            {reportText && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-(--text-tertiary)">
                    Report ({reportText.length.toLocaleString()} chars)
                  </span>
                  <button
                    onClick={() => {
                      if (!reportText) return;
                      navigator.clipboard.writeText(reportText).then(() => {
                        setReportCopied(true);
                        setTimeout(() => setReportCopied(false), 2000);
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-(--bg-tertiary) border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) text-xs"
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
                  className="w-full h-72 p-3 rounded-lg bg-(--bg-primary) border border-(--border-primary) text-(--text-primary) text-xs font-mono resize-y focus:outline-none focus:border-(--accent-blue)"
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
            <h2 className="text-lg font-bold text-(--text-primary) mb-3">
              Testing Recipes
            </h2>
            <div className="space-y-3 text-sm text-(--text-secondary)">
              <div>
                <div className="font-semibold text-(--text-primary) mb-1">
                  1. Test the auto-grant flow
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                  <li>Click "Reset to 0 + Clear Grants"</li>
                  <li>Reload the browser (Ctrl+F5)</li>
                  <li>Watch the sidebar Credit Balance — it should auto-refill to the plan's monthly amount</li>
                  <li>Check the ledger below — a new <code>subscription</code> entry should appear</li>
                </ol>
              </div>
              <div>
                <div className="font-semibold text-(--text-primary) mb-1">
                  2. Test idempotency
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                  <li>Click "Force Monthly Grant" twice in a row</li>
                  <li>First click → "Granted N credits for plan X"</li>
                  <li>Second click → "Already granted this cycle. No-op"</li>
                </ol>
              </div>
              <div>
                <div className="font-semibold text-(--text-primary) mb-1">
                  3. Test deductCredits
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                  <li>Click "Seed" with amount 1000</li>
                  <li>Go to any AI generation panel, trigger a generation</li>
                  <li>Ledger should show a new <code>usage</code> entry with negative tokens</li>
                </ol>
              </div>
              <div>
                <div className="font-semibold text-(--text-primary) mb-1">
                  4. Share state with Claude for debugging
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-(--text-tertiary) ml-2">
                  <li>Do whatever you're testing (reset, grant, deduct, etc.)</li>
                  <li>Click "Generate Report" above</li>
                  <li>Paste the auto-copied report into the Claude chat</li>
                  <li>Claude reads the exact state and can diagnose precisely instead of guessing</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string | undefined;
  copyable?: boolean;
}) {
  const displayValue = value ?? "—";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-(--border-primary)/30 last:border-0">
      <span className="text-(--text-tertiary)">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-(--text-primary) truncate max-w-[200px]">
          {displayValue}
        </span>
        {copyable && value && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-(--text-tertiary) hover:text-(--text-primary)"
            title="Copy"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Users as UsersIcon, Search, CreditCard, Activity,
  Bell, Coins, ChevronRight, Plus, Minus, Download,
  FileText, ExternalLink,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { USER_LABELS } from "./components/UserLabelBadge";

// ─── display helpers ────────────────────────────────────────────────────────

function getDisplayName(user: any): string {
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.email) {
    const prefix = user.email.split("@")[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, " ");
  }
  return "Unknown";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-600", "bg-orange-500",
  "bg-rose-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500",
];
function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const months = Math.floor(days / 30);
  if (months >= 1) return `${months}mo ago`;
  if (days   >= 1) return `${days}d ago`;
  if (hours  >= 1) return `${hours}h ago`;
  if (mins   >= 1) return `${mins}m ago`;
  return "Just now";
}

const PLAN_LABELS: Record<string, string> = {
  pro_personal: "Pro",
  business: "Business",
  free: "Free",
};

const PLAN_BADGE: Record<string, string> = {
  pro_personal: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  business: "bg-purple-100 text-purple-800 hover:bg-purple-100",
};

// ─────────────────────────────────────────────
// Credit history helpers
// ─────────────────────────────────────────────
const LEDGER_TYPE_META: Record<string, { label: string; cls: string }> = {
  purchase:            { label: "Top-up",       cls: "bg-blue-100 text-blue-800" },
  subscription:        { label: "Grant",         cls: "bg-green-100 text-green-800" },
  usage:               { label: "Used",          cls: "bg-orange-100 text-orange-800" },
  admin_adjustment:    { label: "Admin",         cls: "bg-purple-100 text-purple-800" },
  refund:              { label: "Refund",        cls: "bg-teal-100 text-teal-800" },
  transfer_in:         { label: "Transfer In",  cls: "bg-green-100 text-green-800" },
  transfer_out:        { label: "Transfer Out", cls: "bg-orange-100 text-orange-800" },
  org_created:         { label: "Account",      cls: "bg-gray-100 text-gray-600" },
  subscription_change: { label: "Plan Change",  cls: "bg-gray-100 text-gray-600" },
};

const LEDGER_TYPE_OPTIONS = [
  { value: "exclude_usage",      label: "All (excl. Used)" },  // default
  { value: "all",                label: "All Types" },
  { value: "purchase",           label: "Top-up" },
  { value: "subscription",       label: "Grant" },
  { value: "admin_adjustment",   label: "Admin Adjustment" },
  { value: "refund",             label: "Refund" },
  { value: "transfer_in",        label: "Transfer In" },
  { value: "transfer_out",       label: "Transfer Out" },
  { value: "usage",              label: "Used only" },
];

function ledgerTokenDisplay(entry: any) {
  const tokens: number = entry.tokens ?? 0;
  const isDebit = entry.type === "usage" || entry.type === "transfer_out" || tokens < 0;
  const abs = Math.abs(tokens).toLocaleString();
  return isDebit
    ? <span className="text-xs font-semibold text-red-600">−{abs}</span>
    : <span className="text-xs font-semibold text-green-600">+{abs}</span>;
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

const HISTORY_PER_PAGE = 15;
const PURCHASES_PER_PAGE = 10;

// ─────────────────────────────────────────────
// User Drawer — mounted only when a user is selected
// ─────────────────────────────────────────────
function UserDrawer({
  user,
  onClose,
  onBlock,
  onAlert,
}: {
  user: any;
  onClose: () => void;
  onBlock: () => void;
  onAlert: () => void;
}) {
  const purchases = useQuery(
    api.adminPurchases.getPurchasesByUser,
    user.companyId ? { companyId: user.companyId } : "skip",
  );
  const creditHistory = useQuery(
    api.adminUserManagement.getUserCreditHistory,
    user.companyId ? { companyId: user.companyId } : "skip",
  );
  // Per-user indexed query — only re-fires when THIS user's balance changes
  const userDetails = useQuery(
    api.adminUsers.getUserWithSubscription,
    user.clerkUserId ? { clerkUserId: user.clerkUserId } : "skip",
  );
  const liveBalance = userDetails?.credits ?? null;

  const offlineInvoices = useQuery(
    api.adminManualBilling.getOfflineInvoicesForUser,
    user.companyId ? { companyId: user.companyId } : "skip",
  );

  const adjustCredits = useMutation(api.adminUserManagement.adminAdjustCredits);
  const propagatePlan = useMutation(api.credits.propagateOwnerPlanChange);
  const markOfflinePaid = useMutation(api.adminManualBilling.markOfflineInvoicePaid);

  const [activeTab, setActiveTab] = useState<"purchases" | "history">("purchases");

  // Change plan state — pre-fill with current plan
  const [selectedPlan, setSelectedPlan] = useState<string>(user.ownerPlan ?? "free");
  const [changingPlan, setChangingPlan] = useState(false);

  const handleChangePlan = async () => {
    if (!user.clerkUserId) { toast.error("User has no Clerk ID"); return; }
    setChangingPlan(true);
    try {
      await propagatePlan({ ownerUserId: user.clerkUserId, newPlan: selectedPlan });
      toast.success(`Plan updated to "${PLAN_LABELS[selectedPlan] ?? selectedPlan}" for ${getDisplayName(user)}`);
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleDrawerMarkPaid = async (invoiceId: any, invoiceNo: string, planTier: string) => {
    if (!confirm(`Mark ${invoiceNo} as paid? This activates the ${planTier === "pro_personal" ? "Pro" : "Business"} plan immediately.`)) return;
    try {
      await markOfflinePaid({ invoiceId });
      toast.success(`${invoiceNo} marked paid — plan activated`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to mark paid");
    }
  };

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);

  // Filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState("exclude_usage");
  const [historySearch, setHistorySearch] = useState("");

  // Reset pages when tab or filters change
  useEffect(() => { setHistoryPage(1); }, [historyTypeFilter, historySearch]);
  useEffect(() => { setPurchasesPage(1); }, [activeTab]);

  const filteredHistory = useMemo(() => {
    if (!creditHistory) return [];
    return creditHistory.filter(e => {
      const matchesType =
        historyTypeFilter === "all" ? true :
        historyTypeFilter === "exclude_usage" ? e.type !== "usage" :
        e.type === historyTypeFilter;
      const matchesSearch = !historySearch ||
        e.reason?.toLowerCase().includes(historySearch.toLowerCase()) ||
        e.model?.toLowerCase().includes(historySearch.toLowerCase()) ||
        (LEDGER_TYPE_META[e.type ?? ""]?.label ?? "").toLowerCase().includes(historySearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [creditHistory, historyTypeFilter, historySearch]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PER_PAGE));
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);

  const purchasesTotalPages = Math.max(1, Math.ceil((purchases?.length ?? 0) / PURCHASES_PER_PAGE));
  const paginatedPurchases = (purchases ?? []).slice((purchasesPage - 1) * PURCHASES_PER_PAGE, purchasesPage * PURCHASES_PER_PAGE);

  const handleAdjust = async (sign: 1 | -1) => {
    const n = parseInt(adjustAmount);
    if (!n || n <= 0) { toast.error("Enter a positive amount"); return; }
    if (!adjustReason.trim()) { toast.error("Enter a reason"); return; }
    if (!user.companyId) { toast.error("User has no workspace"); return; }
    setAdjusting(true);
    try {
      const result = await adjustCredits({
        companyId: user.companyId,
        tokens: n * sign,
        reason: adjustReason,
      }) as { newBalance: number };
      toast.success(`Credits ${sign > 0 ? "added" : "deducted"}. New balance: ${result.newBalance.toLocaleString()}`);
      setAdjustAmount("");
      setAdjustReason("");
    } catch {
      toast.error("Failed to adjust credits");
    } finally {
      setAdjusting(false);
    }
  };

  const exportPurchasesCSV = () => {
    if (!purchases?.length) return;
    const headers = ["Date", "Credits", "Amount (MYR)", "Stripe ID"];
    const rows = purchases.map((p: any) => [
      new Date(p.transactionDate).toLocaleDateString(),
      p.tokensAmount || 0,
      ((p.amount || 0) / 100).toFixed(2),
      p.stripePaymentIntentId || "",
    ]);
    downloadCSV([headers, ...rows], `purchases_${user.email || user._id}_${Date.now()}.csv`);
  };

  const exportHistoryCSV = () => {
    if (!filteredHistory.length) return;
    const headers = ["Date", "Time", "Type", "Credits", "Reason", "Model"];
    const rows = filteredHistory.map((e: any) => {
      const meta = LEDGER_TYPE_META[e.type ?? ""] ?? { label: e.type ?? "—" };
      const isDebit = e.type === "usage" || e.type === "transfer_out" || e.tokens < 0;
      return [
        new Date(e.createdAt).toLocaleDateString(),
        new Date(e.createdAt).toLocaleTimeString(),
        meta.label,
        isDebit ? `-${Math.abs(e.tokens)}` : `+${e.tokens}`,
        e.reason || "",
        e.model || "",
      ];
    });
    downloadCSV([headers, ...rows], `credit_history_${user.email || user._id}_${Date.now()}.csv`);
  };

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[440px] sm:w-[500px] flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            {(() => {
              const name = getDisplayName(user);
              return (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${getAvatarColor(name)}`}>
                  {getInitials(name)}
                </div>
              );
            })()}
            <div>
              <SheetTitle className="text-base">{getDisplayName(user)}</SheetTitle>
              <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Profile Info */}
          <div className="px-6 py-4 border-b space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
                {user.ownerPlan && PLAN_BADGE[user.ownerPlan] ? (
                  <Badge className={PLAN_BADGE[user.ownerPlan]}>{PLAN_LABELS[user.ownerPlan]}</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">Free</Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Credits</p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {liveBalance !== null ? liveBalance.toLocaleString() : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Login</p>
                <p className="text-sm">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Member Since</p>
                <p className="text-sm">{new Date(user._creationTime).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              {user.isBlocked
                ? <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>
                : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>}
            </div>
          </div>

          {/* Change Plan */}
          {user.clerkUserId && (
            <div className="px-6 py-4 border-b space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Change Plan</p>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full h-9 text-sm border rounded-md px-3 bg-transparent"
              >
                <option value="free">Free</option>
                <option value="pro_personal">Pro — $45/mo</option>
                <option value="business">Business — $119/mo</option>
              </select>
              <Button
                size="sm"
                className="w-full"
                disabled={changingPlan || selectedPlan === (user.ownerPlan ?? "free")}
                onClick={handleChangePlan}
              >
                {changingPlan ? "Applying…" : "Apply Plan"}
              </Button>
            </div>
          )}

          {/* Offline Invoices */}
          {user.companyId && (
            <div className="px-6 py-4 border-b space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Offline Subscriptions</p>
                <a
                  href="/admin/invoices-and-pos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Manage <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {!offlineInvoices ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : offlineInvoices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No offline invoices</p>
              ) : (
                <div className="space-y-1.5">
                  {offlineInvoices.slice(0, 4).map((inv: any) => {
                    const isOverdue = inv.status === "overdue";
                    const isDueSoon = inv.status === "issued" && inv.dueDate && inv.dueDate - Date.now() < 7 * 24 * 60 * 60 * 1000 && inv.dueDate > Date.now();
                    const planLabel = inv.planTier === "pro_personal" ? "Pro" : "Business";
                    return (
                      <div key={inv._id} className={`flex items-center justify-between rounded-md px-2.5 py-2 text-xs border ${isOverdue ? "bg-red-50 border-red-200" : isDueSoon ? "bg-amber-50 border-amber-200" : "bg-muted/40 border-transparent"}`}>
                        <div className="min-w-0">
                          <span className="font-mono font-medium">{inv.invoiceNo}</span>
                          <span className="text-muted-foreground ml-1.5">{planLabel} · {inv.billingInterval}</span>
                          {inv.dueDate && (
                            <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                              {isOverdue ? "Overdue" : "Due"} {new Date(inv.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            inv.status === "paid" ? "bg-green-100 text-green-700" :
                            inv.status === "overdue" ? "bg-red-100 text-red-700" :
                            inv.status === "cancelled" ? "bg-gray-100 text-gray-500" :
                            "bg-blue-100 text-blue-700"
                          }`}>{inv.status}</span>
                          {inv.status === "issued" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => handleDrawerMarkPaid(inv._id, inv.invoiceNo, inv.planTier)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {offlineInvoices.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+{offlineInvoices.length - 4} more in Invoices page</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Adjust Credits */}
          {user.companyId && (
            <div className="px-6 py-4 border-b space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adjust Credits</p>
              <Input type="number" min="1" placeholder="Amount (e.g. 500)" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
              <Input placeholder="Reason (e.g. support compensation)" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-green-700 border-green-200 hover:bg-green-50" disabled={adjusting} onClick={() => handleAdjust(1)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-red-700 border-red-200 hover:bg-red-50" disabled={adjusting} onClick={() => handleAdjust(-1)}>
                  <Minus className="w-3.5 h-3.5 mr-1" /> Deduct
                </Button>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex border-b shrink-0">
            <button
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === "purchases" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("purchases")}
            >
              Purchases {purchases ? `(${purchases.length})` : ""}
            </button>
            <button
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${activeTab === "history" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("history")}
            >
              Credit History {creditHistory ? `(${creditHistory.length})` : ""}
            </button>
          </div>

          {/* ── Purchases tab ── */}
          {activeTab === "purchases" && (
            <div className="flex flex-col">
              {/* Export row */}
              <div className="px-6 py-2 flex justify-end border-b">
                <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={exportPurchasesCSV} disabled={!purchases?.length}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </Button>
              </div>

              {/* Rows */}
              <div className="px-6">
                {!purchases ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>
                ) : purchases.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No purchases yet</p>
                ) : (
                  <div className="divide-y">
                    {paginatedPurchases.map((p: any) => (
                      <div key={p._id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-xs font-semibold">{(p.tokensAmount || 0).toLocaleString()} credits</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(p.transactionDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                          {p.stripePaymentIntentId && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[200px]">
                              {p.stripePaymentIntentId.substring(0, 26)}…
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-green-700">MYR {((p.amount || 0) / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {purchasesTotalPages > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(purchasesPage - 1) * PURCHASES_PER_PAGE + 1}–{Math.min(purchasesPage * PURCHASES_PER_PAGE, purchases?.length ?? 0)} of {purchases?.length}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setPurchasesPage(p => Math.max(1, p - 1))} disabled={purchasesPage === 1}>‹</Button>
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setPurchasesPage(p => Math.min(purchasesTotalPages, p + 1))} disabled={purchasesPage === purchasesTotalPages}>›</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Credit History tab ── */}
          {activeTab === "history" && (
            <div className="flex flex-col">
              {/* Filter + Export row */}
              <div className="px-6 py-2 border-b flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Search reason, model…"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-6 h-7 text-xs"
                  />
                </div>
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value)}
                  className="h-7 text-xs border rounded px-2 bg-transparent"
                >
                  {LEDGER_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button size="sm" variant="ghost" className="text-xs h-7 px-2 shrink-0" onClick={exportHistoryCSV} disabled={!filteredHistory.length}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Rows */}
              <div className="px-6">
                {!creditHistory ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>
                ) : filteredHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No entries found</p>
                ) : (
                  <div className="divide-y">
                    {paginatedHistory.map((entry: any) => {
                      const meta = LEDGER_TYPE_META[entry.type ?? ""] ?? { label: entry.type ?? "—", cls: "bg-gray-100 text-gray-600" };
                      return (
                        <div key={entry._id} className="flex items-start justify-between py-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${meta.cls}`}>{meta.label}</span>
                              {entry.model && <span className="text-xs text-muted-foreground truncate max-w-[140px]">{entry.model}</span>}
                            </div>
                            {entry.reason && <p className="text-xs text-muted-foreground truncate">{entry.reason}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {" · "}
                              {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="shrink-0">{ledgerTokenDisplay(entry)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>{(historyPage - 1) * HISTORY_PER_PAGE + 1}–{Math.min(historyPage * HISTORY_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}</span>
                  <div className="flex items-center gap-2">
                    <span>Page {historyPage} of {historyTotalPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setHistoryPage(1)} disabled={historyPage === 1}>«</Button>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}>‹</Button>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage === historyTotalPages}>›</Button>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setHistoryPage(historyTotalPages)} disabled={historyPage === historyTotalPages}>»</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions — pinned to bottom */}
        <div className="px-6 py-4 border-t flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="flex-1" onClick={onAlert}>
            <Bell className="w-3.5 h-3.5 mr-1.5" /> Send Alert
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`flex-1 ${user.isBlocked ? "" : "text-destructive hover:bg-destructive/10"}`}
            onClick={onBlock}
          >
            {user.isBlocked ? "Unblock" : "Block"}
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function UsersPage() {
  const users = useQuery(api.adminUsers.getAllUsers);
  const planMap = useQuery(api.adminUsers.getAdminUserPlanMap);
  const stats = useQuery(api.adminUsers.getUserStats);
  const userStats = useQuery(api.adminUserManagement.getUserStatistics);

  // Merge plan data client-side — keeps users subscription fast (no credits_balance join)
  const enrichedUsers = useMemo(() => {
    if (!users) return undefined;
    const plans = new Map((planMap ?? []).map(p => [p.companyId, p.ownerPlan]));
    return users.map(u => ({
      ...u,
      ownerPlan: u.clerkUserId ? (plans.get(u.clerkUserId) ?? null) : null,
    }));
  }, [users, planMap]);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);

  const updateUserLabel = useMutation(api.adminUserManagement.updateUserLabel);
  const toggleUserBlock = useMutation(api.adminUserManagement.toggleUserBlock);
  const createAlert = useMutation(api.alerts.createAlert);

  const selectedUser = selectedUserId ? (enrichedUsers?.find(u => u._id === selectedUserId) ?? null) : null;

  const filteredUsers = useMemo(() => {
    if (!enrichedUsers) return [];
    return enrichedUsers.filter(user => {
      const matchesSearch =
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const userDate = new Date(user._creationTime);
      const matchesDate =
        (!startDate || userDate >= new Date(startDate)) &&
        (!endDate || userDate <= new Date(endDate + "T23:59:59"));
      const matchesLabel = labelFilter === "all" || user.userLabel === labelFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "blocked" && user.isBlocked) ||
        (statusFilter === "active" && !user.isBlocked);
      const matchesPlan =
        planFilter === "all" ||
        (planFilter === "free" ? !user.ownerPlan || user.ownerPlan === "free" : user.ownerPlan === planFilter);
      return matchesSearch && matchesDate && matchesLabel && matchesStatus && matchesPlan;
    });
  }, [enrichedUsers, searchTerm, startDate, endDate, labelFilter, statusFilter, planFilter]);

  useEffect(() => { setPage(1); }, [searchTerm, startDate, endDate, labelFilter, statusFilter, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page]);

  const handleLabelChange = async (userId: any, newLabel: string) => {
    try {
      await updateUserLabel({ userId, userLabel: newLabel, updatedBy: "admin" });
    } catch {
      toast.error("Failed to update label");
    }
  };

  const handleBlockUser = async (userId: string, isCurrentlyBlocked: boolean) => {
    const action = isCurrentlyBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await toggleUserBlock({
        userId: userId as Id<"users">,
        isBlocked: !isCurrentlyBlocked,
        reason: isCurrentlyBlocked ? "Unblocked by admin" : "Blocked by admin",
        updatedBy: "admin",
      });
      toast.success(`User ${action}ed`);
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const sendAlertToUser = async () => {
    if (!alertDialog || !alertMessage.trim()) { toast.error("Enter a message"); return; }
    setSendingAlert(true);
    try {
      await createAlert({
        title: "Message from Admin",
        message: alertMessage,
        type: "info",
        targetType: "specific_user",
        targetValue: alertDialog.userId,
        priority: 5,
        isDismissible: true,
        createdBy: "admin",
      });
      toast.success(`Alert sent to ${alertDialog.userName}`);
      setAlertDialog(null);
      setAlertMessage("");
    } catch {
      toast.error("Failed to send alert");
    } finally {
      setSendingAlert(false);
    }
  };

  const getPlanBadge = (plan: string | null | undefined) => {
    if (plan && PLAN_BADGE[plan]) {
      return <Badge className={PLAN_BADGE[plan]}>{PLAN_LABELS[plan]}</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500 text-xs">Free</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage accounts, credits, and access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Users</p>
              <UsersIcon className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalUsers || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">All registered accounts</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><UsersIcon className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/90 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Subscribed</p>
              <CreditCard className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.activeSubscriptions || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">Active paid plans</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><CreditCard className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Free Users</p>
              <UsersIcon className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.freeUsers || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">No active plan</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><UsersIcon className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/70 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Active (30d)</p>
              <Activity className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{userStats?.activeLastMonth || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">Logged in last 30 days</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><Activity className="h-20 w-20" /></div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input type="date" className="w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" className="w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="pro_personal">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
        <Select value={labelFilter} onValueChange={setLabelFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Labels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {USER_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-600">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">User</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Plan</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Label</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Last Login</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!enrichedUsers ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : paginatedUsers.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No users found</td></tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUserId(user._id)}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const name = getDisplayName(user);
                        return (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${getAvatarColor(name)}`}>
                            {getInitials(name)}
                          </div>
                        );
                      })()}
                      <div>
                        <div className="font-medium text-sm">{getDisplayName(user)}</div>
                        <div className="text-xs text-gray-500">{user.email || "No email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(user.ownerPlan)}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={user.userLabel || ""}
                      onChange={(e) => handleLabelChange(user._id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="">No Label</option>
                      {USER_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.lastLoginAt ? (
                      <div>
                        <span className="text-sm text-gray-700">{timeAgo(user.lastLoginAt)}</span>
                        <div className="text-xs text-gray-400">{new Date(user.lastLoginAt).toLocaleDateString()}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAlertDialog({
                          userId: user.clerkUserId || user._id,
                          userName: getDisplayName(user),
                          userEmail: user.email || "",
                        })}
                      >
                        <Bell className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUser(user._id, user.isBlocked || false)}
                        className={user.isBlocked ? "" : "text-destructive hover:bg-destructive/10"}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(user._id)}
                        className="text-muted-foreground"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Drawer — conditional mount so subscription only lives while open */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUserId(null)}
          onBlock={() => {
            handleBlockUser(selectedUser._id, selectedUser.isBlocked || false);
          }}
          onAlert={() => {
            setSelectedUserId(null);
            setAlertDialog({
              userId: selectedUser.clerkUserId || selectedUser._id,
              userName: getDisplayName(selectedUser),
              userEmail: selectedUser.email || "",
            });
          }}
        />
      )}

      {/* Alert Dialog */}
      {alertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Send Alert to {alertDialog.userName}</h3>
              <button onClick={() => setAlertDialog(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">To: {alertDialog.userEmail}</p>
              <div>
                <Label className="text-sm font-medium block mb-1.5">Message</Label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full border rounded-lg p-3 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setAlertDialog(null)} className="flex-1">Cancel</Button>
              <Button onClick={sendAlertToUser} disabled={!alertMessage.trim() || sendingAlert} className="flex-1">
                {sendingAlert ? "Sending..." : "Send Alert"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

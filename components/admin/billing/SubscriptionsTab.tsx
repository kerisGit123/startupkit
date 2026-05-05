"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CheckCircle, XCircle, Search, Download, RefreshCw, ExternalLink, ShieldCheck } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PLAN_PRICES: Record<string, number> = {
  pro_personal: 45.00,
  business: 119.00,
};

const PLAN_LABELS: Record<string, string> = {
  pro_personal: "Pro",
  business: "Business",
  free: "Free",
};

// Extracted so allUsers subscription only exists while dialog is mounted
function ForceSyncDialog({ onClose, propagatePlan }: {
  onClose: () => void;
  propagatePlan: (args: { ownerUserId: string; newPlan: string }) => Promise<unknown>;
}) {
  const allUsers = useQuery(api.adminUsers.getAllUsers);
  const [syncUserSearch, setSyncUserSearch] = useState("");
  const [syncSelectedUser, setSyncSelectedUser] = useState<any>(null);
  const [syncPlan, setSyncPlan] = useState("pro_personal");
  const [syncing, setSyncing] = useState(false);

  const filteredSyncUsers = useMemo(() => {
    if (!allUsers || !syncUserSearch) return [];
    const q = syncUserSearch.toLowerCase();
    return allUsers
      .filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allUsers, syncUserSearch]);

  const handleForceSync = async () => {
    if (!syncSelectedUser?.clerkUserId) { toast.error("Select a user first"); return; }
    setSyncing(true);
    try {
      await propagatePlan({ ownerUserId: syncSelectedUser.clerkUserId, newPlan: syncPlan });
      toast.success(`Plan set to "${PLAN_LABELS[syncPlan] || syncPlan}" for ${syncSelectedUser.email}`);
      onClose();
    } catch {
      toast.error("Failed to sync plan");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Force Sync Subscription</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Use this when a user subscribed in Clerk but their plan didn't sync to Convex (e.g. webhook missed an event).
        </p>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Search User</Label>
            <Input
              placeholder="Type name or email..."
              value={syncUserSearch}
              onChange={e => { setSyncUserSearch(e.target.value); setSyncSelectedUser(null); }}
            />
            {filteredSyncUsers.length > 0 && !syncSelectedUser && (
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {filteredSyncUsers.map(u => (
                  <button
                    key={u._id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { setSyncSelectedUser(u); setSyncUserSearch(u.email || u.fullName || ""); }}
                  >
                    <span className="font-medium">{u.fullName || u.firstName || u.email}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {syncSelectedUser && (
              <p className="text-xs text-green-600">✓ Selected: {syncSelectedUser.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Set Plan To</Label>
            <Select value={syncPlan} onValueChange={setSyncPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pro_personal">Pro — MYR 45/mo</SelectItem>
                <SelectItem value="business">Business — MYR 119/mo</SelectItem>
                <SelectItem value="free">Free (downgrade)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleForceSync} disabled={syncing || !syncSelectedUser}>
            {syncing ? "Syncing..." : "Apply Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionsTab() {
  const subscriptions = useQuery(api.adminSubscriptions.getAllSubscriptions);
  const stats = useQuery(api.adminSubscriptions.getSubscriptionStats);
  const propagatePlan = useMutation(api.credits.propagateOwnerPlanChange);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    return subscriptions.filter(sub => {
      const matchesSearch =
        sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripeSubscriptionId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = planFilter === "all" || sub.plan === planFilter;
      const subDate = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date(sub._creationTime);
      const matchesDate =
        (!startDate || subDate >= new Date(startDate)) &&
        (!endDate || subDate <= new Date(endDate + "T23:59:59"));
      return matchesSearch && matchesPlan && matchesDate;
    });
  }, [subscriptions, searchTerm, planFilter, startDate, endDate]);

  useEffect(() => { setPage(1); }, [searchTerm, planFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / rowsPerPage));
  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredSubscriptions.slice(start, start + rowsPerPage);
  }, [filteredSubscriptions, page, rowsPerPage]);

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd && status === "active")
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Canceling</Badge>;
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "canceled":
      case "cancelled": return <Badge variant="outline" className="text-red-600 border-red-200">Canceled</Badge>;
      case "past_due": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Past Due</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => PLAN_LABELS[plan] || plan || "Free";

  const getPriorityIcon = (plan: string) => {
    switch (plan) {
      case "business": return "↑";
      case "pro_personal": return "→";
      default: return "↓";
    }
  };

  const exportToCSV = () => {
    const headers = ["Customer Name", "Email", "Plan", "Status", "Price/mo"];
    const rows = filteredSubscriptions.map(sub => [
      sub.userName || "Unknown",
      sub.userEmail || "",
      getPlanLabel(sub.plan || ""),
      sub.status || "inactive",
      `MYR ${(PLAN_PRICES[sub.plan || ""] || 0).toFixed(2)}`,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `subscriptions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Managed by Clerk Billing — synced via webhook
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowSyncDialog(true)}>
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Force Sync
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Clerk Dashboard
            </a>
          </Button>
          <Button size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total</p>
              <Users className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalSubscriptions || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">All-time subscriptions</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><Users className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/90 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Active</p>
              <CheckCircle className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.activeSubscriptions || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">
              {stats?.totalSubscriptions ? Math.round(((stats.activeSubscriptions || 0) / stats.totalSubscriptions) * 100) : 0}% of total
            </p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><CheckCircle className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Churn</p>
              <XCircle className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{(stats?.canceledSubscriptions || 0) + (stats?.cancelingSubscriptions || 0)}</p>
            <p className="text-xs mt-1.5 opacity-70">{stats?.churnRate || "0.0"}% churn rate</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><XCircle className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/70 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">MRR</p>
              <RefreshCw className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">MYR {stats?.mrr || "0.00"}</p>
            <p className="text-xs mt-1.5 opacity-70">Monthly Recurring Revenue</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><RefreshCw className="h-20 w-20" /></div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Filter subscriptions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="pro_personal">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-6 py-3 text-sm font-medium text-gray-600"><input type="checkbox" className="rounded" /></th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Customer</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Plan</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Price/mo</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600">Renewal <span className="text-xs font-normal text-muted-foreground">(Clerk)</span></th>
                <th className="px-6 py-3 text-sm font-medium text-gray-600 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!subscriptions ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No subscriptions found.{" "}
                    <button onClick={() => setShowSyncDialog(true)} className="underline text-primary hover:opacity-80">
                      Force Sync a user
                    </button>{" "}
                    if you know someone has a paid plan.
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{sub.userName || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{sub.userEmail || "No email"}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.status || "inactive", sub.cancelAtPeriodEnd)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500">{getPriorityIcon(sub.plan || "")}</span>
                        <span className="text-sm font-medium">{getPlanLabel(sub.plan || "")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-sm">MYR {(PLAN_PRICES[sub.plan || ""] || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {sub.currentPeriodEnd ? (
                        <span className="text-sm">{new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <a href="https://dashboard.clerk.com/" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <ExternalLink className="w-3.5 h-3.5" />Manage
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredSubscriptions.length > 0 && (
            <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
              <div>{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showSyncDialog && (
        <ForceSyncDialog
          onClose={() => setShowSyncDialog(false)}
          propagatePlan={propagatePlan}
        />
      )}
    </div>
  );
}

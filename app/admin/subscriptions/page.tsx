"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, CheckCircle, XCircle, Search, Download, Calendar, RefreshCw } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SubscriptionsPage() {
  const subscriptions = useQuery(api.adminSubscriptions.getAllSubscriptions);
  const stats = useQuery(api.adminSubscriptions.getSubscriptionStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return [];
    
    return subscriptions.filter(sub => {
      const matchesSearch = 
        sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripeSubscriptionId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlan = !planFilter || sub.plan?.toLowerCase() === planFilter.toLowerCase();
      
      const subDate = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date(sub._creationTime);
      const matchesStartDate = !startDate || subDate >= new Date(startDate);
      const matchesEndDate = !endDate || subDate <= new Date(endDate + "T23:59:59");
      const matchesDate = matchesStartDate && matchesEndDate;
      
      return matchesSearch && matchesPlan && matchesDate;
    });
  }, [subscriptions, searchTerm, planFilter, startDate, endDate]);

  const PLAN_PRICES: Record<string, number> = {
    starter: 19.90,
    pro: 29.00,
    business: 99.00,
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd && status === "active") {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Canceling</Badge>;
    }
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "canceled":
      case "cancelled":
        return <Badge variant="outline" className="text-red-600 border-red-200">Canceled</Badge>;
      case "past_due":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Subscription ID', 'Customer Name', 'Email', 'Plan', 'Status', 'Created Date'];
    const csvData = filteredSubscriptions.map(sub => [
      sub.stripeSubscriptionId || 'N/A',
      sub.userName || 'Unknown',
      sub.userEmail || 'No email',
      sub.plan || 'Free',
      sub.status || 'inactive',
      new Date(sub._creationTime).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "business":
        return "↑";
      case "pro":
        return "→";
      default:
        return "↓";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage all customer subscriptions
          </p>
        </div>
        <Button size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Baremetrics-style Stats Cards */}
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

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          placeholder="Start date"
          className="w-40"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          placeholder="End date"
          className="w-40"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-600">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Subscription</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Customer</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Plan</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Price/mo</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Renewal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!filteredSubscriptions ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredSubscriptions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No subscriptions found</td></tr>
            ) : (
              filteredSubscriptions.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs px-2">
                        {sub.plan?.substring(0, 3).toUpperCase() || "SUB"}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">
                          {sub.plan?.charAt(0).toUpperCase() + sub.plan?.slice(1) || "Subscription"}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1 flex items-center gap-2">
                          <a 
                            href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                          >
                            ID: {sub.stripeSubscriptionId?.substring(0, 20) || "N/A"}...
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(sub.stripeSubscriptionId || "")}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                            title="Copy Stripe ID"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{sub.userName || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{sub.userEmail || "No email"}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(sub.status || "inactive", sub.cancelAtPeriodEnd)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">{getPriorityIcon(sub.plan || "")}</span>
                      <span className="text-sm capitalize font-medium">{sub.plan || "Free"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-sm">
                      MYR {(PLAN_PRICES[sub.plan || ""] || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub.currentPeriodEnd ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{new Date(sub.currentPeriodEnd * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        {filteredSubscriptions && filteredSubscriptions.length > 0 && (
          <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''}</div>
            <div className="flex items-center gap-2">
              <span>Page 1 of {Math.ceil(filteredSubscriptions.length / 10)}</span>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, DollarSign, TrendingUp, Coins, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PurchasesTab() {
  const purchases = useQuery(api.adminPurchases.getAllPurchases);
  const stats = useQuery(api.adminPurchases.getPurchaseStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creditFilter, setCreditFilter] = useState("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases.filter(purchase => {
      const matchesSearch = 
        purchase.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const purchaseDate = new Date(purchase.createdAt);
      const matchesStartDate = !startDate || purchaseDate >= new Date(startDate);
      const matchesEndDate = !endDate || purchaseDate <= new Date(endDate + "T23:59:59");
      const matchesDate = matchesStartDate && matchesEndDate;
      
      const matchesCredit = creditFilter === "all" ||
        (creditFilter === "25000+" ? purchase.tokens >= 25000 : purchase.tokens.toString() === creditFilter);
      
      return matchesSearch && matchesDate && matchesCredit;
    });
  }, [purchases, searchTerm, startDate, endDate, creditFilter]);

  useEffect(() => { setPage(1); }, [searchTerm, startDate, endDate, creditFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / rowsPerPage));
  const paginatedPurchases = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredPurchases.slice(start, start + rowsPerPage);
  }, [filteredPurchases, page, rowsPerPage]);

  const getCreditBadge = (tokens: number) => {
    if (tokens >= 25000) return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">25,000</Badge>;
    if (tokens >= 5000) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">5,000</Badge>;
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">1,000</Badge>;
  };

  const getPriorityIcon = (tokens: number) => {
    if (tokens >= 25000) return "↑";
    if (tokens >= 5000) return "→";
    return "↓";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credit Purchases</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Track all credit purchases and transactions
        </p>
      </div>

      {/* Stats Cards - Gradient style matching Revenue & Subscriptions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Purchases</p>
              <ShoppingCart className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalPurchases || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">All-time purchases</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><ShoppingCart className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/90 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Revenue</p>
              <DollarSign className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">MYR {stats?.totalRevenue || "0.00"}</p>
            <p className="text-xs mt-1.5 opacity-70">Lifetime credit revenue</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><DollarSign className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">This Month</p>
              <TrendingUp className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">MYR {stats?.monthlyRevenue || "0.00"}</p>
            <p className="text-xs mt-1.5 opacity-70">{stats?.thisMonthPurchases || 0} purchases this month</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><TrendingUp className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-primary/70 text-primary-foreground shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Credits Sold</p>
              <Coins className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalCredits || 0}</p>
            <p className="text-xs mt-1.5 opacity-70">Total credits distributed</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><Coins className="h-20 w-20" /></div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter purchases..."
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
        <Select value={creditFilter} onValueChange={setCreditFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Credits" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Credits</SelectItem>
            <SelectItem value="1000">1,000 Credits</SelectItem>
            <SelectItem value="5000">5,000 Credits</SelectItem>
            <SelectItem value="25000">25,000 Credits</SelectItem>
            <SelectItem value="25000+">Above 25,000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clean Table - Image 4 Style */}
      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-600">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Purchase</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Customer</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Date</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Credits</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!purchases ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : paginatedPurchases.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No purchases found</td></tr>
            ) : (
              paginatedPurchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs px-2">
                        PUR
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">
                          Credit Purchase
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <a 
                            href={`https://dashboard.stripe.com/payments/${purchase.stripePaymentIntentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:underline"
                          >
                            ID: {purchase.stripePaymentIntentId?.substring(0, 20) || "N/A"}...
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText(purchase.stripePaymentIntentId || "")}
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
                    <div className="text-sm">{purchase.userName || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{purchase.userEmail || "No email"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {new Date(purchase.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(purchase.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCreditBadge(purchase.tokens)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">{getPriorityIcon(purchase.tokens)}</span>
                      <span className="text-sm font-medium">MYR {((purchase.amountPaid || 0) / 100).toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        {filteredPurchases.length > 0 && (
          <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {filteredPurchases.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredPurchases.length)} of {filteredPurchases.length} purchases
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
    </div>
  );
}

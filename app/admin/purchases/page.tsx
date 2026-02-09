"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, DollarSign, TrendingUp, Coins, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PurchasesPage() {
  const purchases = useQuery(api.adminPurchases.getAllPurchases);
  const stats = useQuery(api.adminPurchases.getPurchaseStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creditFilter, setCreditFilter] = useState("");

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
      
      const matchesCredit = !creditFilter || 
        (creditFilter === "500+" ? purchase.tokens > 500 : purchase.tokens.toString() === creditFilter);
      
      return matchesSearch && matchesDate && matchesCredit;
    });
  }, [purchases, searchTerm, startDate, endDate, creditFilter]);

  const getCreditBadge = (tokens: number) => {
    if (tokens >= 500) return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">500+</Badge>;
    if (tokens >= 300) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">300</Badge>;
    if (tokens >= 200) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">200</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">100</Badge>;
  };

  const getPriorityIcon = (tokens: number) => {
    if (tokens >= 500) return "↑";
    if (tokens >= 300) return "→";
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
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-violet-100 text-xs font-semibold uppercase tracking-wider">Total Purchases</p>
              <ShoppingCart className="h-4 w-4 text-violet-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalPurchases || 0}</p>
            <p className="text-violet-200 text-xs mt-1.5">All-time purchases</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><ShoppingCart className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
              <DollarSign className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">MYR {stats?.totalRevenue || "0.00"}</p>
            <p className="text-emerald-200 text-xs mt-1.5">Lifetime credit revenue</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><DollarSign className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">This Month</p>
              <TrendingUp className="h-4 w-4 text-blue-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">MYR {stats?.monthlyRevenue || "0.00"}</p>
            <p className="text-blue-200 text-xs mt-1.5">{stats?.thisMonthPurchases || 0} purchases this month</p>
          </CardContent>
          <div className="absolute -right-3 -bottom-3 opacity-10"><TrendingUp className="h-20 w-20" /></div>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Credits Sold</p>
              <Coins className="h-4 w-4 text-amber-200" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{stats?.totalCredits || 0}</p>
            <p className="text-amber-200 text-xs mt-1.5">Total credits distributed</p>
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
        <select
          value={creditFilter}
          onChange={(e) => setCreditFilter(e.target.value)}
          className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Credits</option>
          <option value="100">100 Credits</option>
          <option value="200">200 Credits</option>
          <option value="300">300 Credits</option>
          <option value="500">500 Credits</option>
          <option value="500+">Above 500</option>
        </select>
      </div>

      {/* Clean Table - Image 4 Style */}
      <div className="bg-white rounded-lg border">
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
            {!filteredPurchases ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredPurchases.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No purchases found</td></tr>
            ) : (
              filteredPurchases.map((purchase) => (
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
        <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-gray-600">
          <div>0 of {filteredPurchases?.length || 0} row(s) selected.</div>
          <div className="flex items-center gap-4">
            <span>Rows per page: 10</span>
            <span>Page 1 of {Math.ceil((filteredPurchases?.length || 0) / 10)}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>«</Button>
              <Button variant="outline" size="sm" disabled>‹</Button>
              <Button variant="outline" size="sm">›</Button>
              <Button variant="outline" size="sm">»</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

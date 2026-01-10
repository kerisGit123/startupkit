"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, DollarSign, TrendingUp, Coins, Search, MoreHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h1 className="text-3xl font-bold">Purchases</h1>
        <p className="text-muted-foreground mt-2">
          Track all credit purchases and transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MYR {stats?.totalRevenue || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MYR {stats?.monthlyRevenue || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.thisMonthPurchases || 0} purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Sold</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCredits || 0}</div>
          </CardContent>
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
        <Button variant="outline" size="sm">
          View
        </Button>
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
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Credits</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Amount</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
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
                        <div className="text-xs text-gray-500">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{purchase.userName || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{purchase.userEmail || "No email"}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getCreditBadge(purchase.tokens)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500">{getPriorityIcon(purchase.tokens)}</span>
                      <span className="text-sm font-medium">MYR {(purchase.amountPaid ? purchase.amountPaid / 100 : 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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

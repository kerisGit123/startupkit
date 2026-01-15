"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, Calendar, Eye, Edit, Share2, Trash2, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { POEditDialog } from "@/components/POEditDialog";
import { SharePODialog } from "@/components/SharePODialog";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const purchaseOrders = useQuery(api.purchaseOrders.queries.getAllPurchaseOrders);
  const deletePO = useMutation(api.purchaseOrders.mutations.deletePurchaseOrder);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateSearchType, setDateSearchType] = useState<"purchase" | "due">("purchase");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPO, setEditingPO] = useState<any>(null);
  const [sharingPO, setSharingPO] = useState<any>(null);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filteredPOs = useMemo(() => {
    if (!purchaseOrders) return [];

    return purchaseOrders.filter(po => {
      // Search filter
      const matchesSearch = !searchTerm || 
        po.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter based on search type
      let matchesDateRange = true;
      if (startDate || endDate) {
        if (dateSearchType === "purchase") {
          const poDate = new Date(po.createdAt);
          const matchesStart = !startDate || poDate >= new Date(startDate);
          const matchesEnd = !endDate || poDate <= new Date(endDate + "T23:59:59");
          matchesDateRange = matchesStart && matchesEnd;
        } else {
          // Due date search
          const dueDate = po.dueDate ? new Date(po.dueDate) : null;
          if (!dueDate) {
            matchesDateRange = false; // Exclude POs without due date when filtering by due date
          } else {
            const matchesStart = !startDate || dueDate >= new Date(startDate);
            const matchesEnd = !endDate || dueDate <= new Date(endDate + "T23:59:59");
            matchesDateRange = matchesStart && matchesEnd;
          }
        }
      }
      
      // Status filter
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      
      return matchesSearch && matchesDateRange && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, dateSearchType, startDate, endDate, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      sent: { label: "Sent", className: "bg-blue-100 text-blue-800" },
      approved: { label: "Approved", className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
      completed: { label: "Completed", className: "bg-purple-100 text-purple-800" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleDelete = async (poId: string, poNo: string) => {
    if (!confirm(`Are you sure you want to delete PO ${poNo}?`)) return;
    
    try {
      await deletePO({ poId: poId as any });
      toast.success(`PO ${poNo} deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete PO");
      console.error(error);
    }
  };

  const stats = useMemo(() => {
    if (!purchaseOrders) return { total: 0, draft: 0, sent: 0, totalAmount: 0 };
    
    return {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter(po => po.status === "draft").length,
      sent: purchaseOrders.filter(po => po.status === "sent").length,
      totalAmount: purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0) / 100,
    };
  }, [purchaseOrders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all purchase orders with due date filtering
          </p>
        </div>
        <Link href="/admin/invoices-and-pos">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by PO#, customer name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-6">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Search:
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateSearchType"
                    value="purchase"
                    checked={dateSearchType === "purchase"}
                    onChange={(e) => setDateSearchType(e.target.value as "purchase" | "due")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Purchase Date</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateSearchType"
                    value="due"
                    checked={dateSearchType === "due"}
                    onChange={(e) => setDateSearchType(e.target.value as "purchase" | "due")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Due Date</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {(searchTerm || startDate || endDate || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!purchaseOrders ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading purchase orders...</p>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No purchase orders found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || startDate || endDate || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first purchase order to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po._id}>
                      <TableCell className="font-mono font-medium">{po.poNo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{po.vendorName}</div>
                          {po.vendorEmail && (
                            <div className="text-sm text-muted-foreground">{po.vendorEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(po.createdAt)}</TableCell>
                      <TableCell>
                        {po.dueDate ? (
                          <span className={
                            new Date(po.dueDate) < new Date() 
                              ? "text-red-600 font-medium" 
                              : ""
                          }>
                            {formatDate(po.dueDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{po.paymentTerms || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        RM {((po.total || 0) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/po/${po._id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!po.convertedToInvoiceId && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => setEditingPO(po)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => setSharingPO(po)}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(po._id, po.poNo)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingPO && (
        <POEditDialog
          poId={editingPO._id}
          isOpen={!!editingPO}
          onClose={() => setEditingPO(null)}
        />
      )}

      {/* Share Dialog */}
      {sharingPO && (
        <SharePODialog
          poId={sharingPO._id}
          isOpen={!!sharingPO}
          onClose={() => setSharingPO(null)}
        />
      )}
    </div>
  );
}

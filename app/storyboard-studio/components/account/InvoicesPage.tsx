"use client";

import { useState } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown,
  FileText, Search, Download, Eye, Loader2,
  Receipt, CreditCard, Calendar, DollarSign, X,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface InvoicesPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const statusColor: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  issued: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const typeColor: Record<string, string> = {
  payment: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  subscription: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

type InvoiceType = "all" | "subscription" | "payment";
type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled" | "overdue" | undefined;

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
  }).format(amount / 100);
};

export default function InvoicesPage({ sidebarOpen, onToggleSidebar }: InvoicesPageProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("all");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>(undefined);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<Id<"invoices"> | null>(null);

  const invoices = useQuery(
    api.invoices.userQueries.getUserInvoicesWithFilters,
    user?.id ? {
      companyId: user.id,
      invoiceType,
      status: statusFilter,
      searchQuery: searchQuery || undefined,
      limit: 100,
    } : "skip"
  );

  const stats = useQuery(
    api.invoices.userQueries.getUserInvoiceStats,
    user?.id ? { companyId: user.id } : "skip"
  );

  const selectedInvoice = useQuery(
    api.invoices.userQueries.getUserInvoiceDetail,
    selectedInvoiceId && user?.id ? {
      invoiceId: selectedInvoiceId,
      companyId: user.id,
    } : "skip"
  );

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Invoices</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrgSwitcher />
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        <p className="text-sm text-(--text-tertiary)">View and manage your invoices, subscriptions, and payments</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Invoices", value: stats.total, icon: FileText, color: "blue" },
              { label: "Total Amount", value: formatCurrency(stats.totalAmount), icon: DollarSign, color: "violet" },
              { label: "Paid", value: formatCurrency(stats.totalPaid), icon: Receipt, color: "emerald" },
              { label: "Pending", value: formatCurrency(stats.totalPending), icon: Calendar, color: "amber" },
            ].map((s) => (
              <div key={s.label} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-4">
                <div className={`p-2 rounded-lg bg-${s.color}-500/10 w-fit mb-2`}>
                  <s.icon className={`w-4 h-4 text-${s.color}-400`} />
                </div>
                <p className="text-xs text-(--text-tertiary) mb-0.5">{s.label}</p>
                <p className="text-xl font-bold text-(--text-primary)">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search by invoice number, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-(--bg-secondary) border border-(--border-primary) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-(--accent-purple)"
            />
          </div>
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
            className="px-3 py-2 bg-(--bg-secondary) border border-(--border-primary) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--accent-purple)"
          >
            <option value="all">All Types</option>
            <option value="subscription">Subscription</option>
            <option value="payment">Payment</option>
          </select>
          <select
            value={statusFilter || "all"}
            onChange={(e) => setStatusFilter(e.target.value === "all" ? undefined : e.target.value as InvoiceStatus)}
            className="px-3 py-2 bg-(--bg-secondary) border border-(--border-primary) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--accent-purple)"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="issued">Issued</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-(--border-primary)">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <FileText className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">Invoice History</h2>
              <p className="text-xs text-(--text-tertiary)">
                {invoices ? `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} found` : "Loading..."}
              </p>
            </div>
          </div>

          {!invoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-(--text-tertiary)" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-(--text-tertiary) mx-auto mb-3" />
              <p className="text-sm text-(--text-secondary)">No invoices found</p>
              <p className="text-xs text-(--text-tertiary) mt-1">
                {searchQuery || invoiceType !== "all" || statusFilter
                  ? "Try adjusting your filters"
                  : "Your invoices will appear here once you make a purchase"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border-primary)">
                    {["Invoice #", "Date", "Type", "Description", "Amount", "Status", ""].map((h) => (
                      <th key={h} className={`py-3 px-4 font-medium text-(--text-tertiary) ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="border-b border-(--border-primary) hover:bg-(--bg-tertiary) transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-(--text-primary)">{inv.invoiceNo}</td>
                      <td className="py-3 px-4 text-(--text-secondary)">{formatDate(inv.issuedAt || inv.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[inv.invoiceType] || ""}`}>
                          {inv.invoiceType === "subscription" ? <CreditCard className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                          {inv.invoiceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-(--text-primary) truncate max-w-[200px]">{inv.items[0]?.description || "N/A"}</p>
                        {inv.items.length > 1 && (
                          <p className="text-xs text-(--text-tertiary)">+{inv.items.length - 1} more</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-(--text-primary)">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[inv.status] || ""}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceId(inv._id)}
                          className="p-1.5 rounded-lg hover:bg-(--bg-tertiary) text-(--text-tertiary) hover:text-(--text-primary) transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoiceId(null)}>
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-(--border-primary)">
              <div>
                <h2 className="text-lg font-semibold text-(--text-primary)">Invoice Details</h2>
                {selectedInvoice && <p className="text-xs text-(--text-tertiary) mt-0.5">Invoice {selectedInvoice.invoiceNo}</p>}
              </div>
              <button onClick={() => setSelectedInvoiceId(null)} className="p-1.5 rounded-lg hover:bg-(--bg-tertiary) text-(--text-tertiary) hover:text-(--text-primary)">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedInvoice ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-(--text-tertiary)" />
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-(--text-primary)">{selectedInvoice.invoiceNo}</h3>
                    <p className="text-sm text-(--text-tertiary) mt-1">Issued: {formatDate(selectedInvoice.issuedAt || selectedInvoice.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selectedInvoice.status] || ""}`}>
                      {selectedInvoice.status}
                    </span>
                    <br />
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[selectedInvoice.invoiceType] || ""}`}>
                      {selectedInvoice.invoiceType}
                    </span>
                  </div>
                </div>

                {/* Billing */}
                <div className="border-t border-(--border-primary) pt-4">
                  <h4 className="text-sm font-semibold text-(--text-primary) mb-2">Billing Information</h4>
                  <div className="text-sm text-(--text-secondary)">
                    <p className="font-medium text-(--text-primary)">{selectedInvoice.billingDetails.name}</p>
                    <p>{selectedInvoice.billingDetails.email}</p>
                    {selectedInvoice.billingDetails.address && (
                      <>
                        <p className="mt-1">{selectedInvoice.billingDetails.address}</p>
                        <p>{[selectedInvoice.billingDetails.city, selectedInvoice.billingDetails.state, selectedInvoice.billingDetails.postalCode].filter(Boolean).join(", ")}</p>
                        {selectedInvoice.billingDetails.country && <p>{selectedInvoice.billingDetails.country}</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-(--border-primary) pt-4">
                  <h4 className="text-sm font-semibold text-(--text-primary) mb-3">Items</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-(--border-primary)">
                        <th className="text-left py-2 text-(--text-tertiary) font-medium">Description</th>
                        <th className="text-center py-2 text-(--text-tertiary) font-medium">Qty</th>
                        <th className="text-right py-2 text-(--text-tertiary) font-medium">Unit Price</th>
                        <th className="text-right py-2 text-(--text-tertiary) font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-(--border-primary)">
                          <td className="py-2.5 text-(--text-primary)">{item.description}</td>
                          <td className="py-2.5 text-(--text-secondary) text-center">{item.quantity}</td>
                          <td className="py-2.5 text-(--text-secondary) text-right">{formatCurrency(item.unitPrice, selectedInvoice.currency)}</td>
                          <td className="py-2.5 text-(--text-primary) font-medium text-right">{formatCurrency(item.total, selectedInvoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t border-(--border-primary) pt-4">
                  <div className="space-y-1.5 max-w-xs ml-auto text-sm">
                    <div className="flex justify-between">
                      <span className="text-(--text-tertiary)">Subtotal:</span>
                      <span className="text-(--text-primary)">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                    </div>
                    {selectedInvoice.tax && selectedInvoice.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-(--text-tertiary)">Tax {selectedInvoice.taxRate ? `(${selectedInvoice.taxRate}%)` : ""}:</span>
                        <span className="text-(--text-primary)">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                      </div>
                    )}
                    {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-(--text-tertiary)">Discount:</span>
                        <span className="text-emerald-400">-{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-(--border-primary) pt-2">
                      <span className="text-(--text-primary)">Total:</span>
                      <span className="text-(--text-primary)">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="border-t border-(--border-primary) pt-4">
                    <h4 className="text-sm font-semibold text-(--text-primary) mb-1">Notes</h4>
                    <p className="text-sm text-(--text-secondary)">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-(--border-primary) pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedInvoiceId(null)}
                    className="px-4 py-2 rounded-lg border border-(--border-primary) text-sm text-(--text-secondary) hover:bg-(--bg-tertiary) transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => alert("Download functionality coming soon!")}
                    className="px-4 py-2 rounded-lg bg-(--accent-purple) text-white text-sm hover:bg-(--accent-purple-hover) transition flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

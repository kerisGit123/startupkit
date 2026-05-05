"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Search, Edit, Trash2, Building2, Users,
  ChevronLeft, ChevronRight, UserCheck, UserX,
  FileText, ExternalLink, Coins,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

const TYPE_META: Record<string, { label: string; color: string }> = {
  saas:       { label: "SaaS",       color: "bg-blue-100 text-blue-800" },
  local:      { label: "Local",      color: "bg-emerald-100 text-emerald-800" },
  enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-800" },
  agency:     { label: "Agency",     color: "bg-orange-100 text-orange-800" },
  offline:    { label: "Offline",    color: "bg-gray-100 text-gray-700" },
};

const DEAL_META: Record<string, { label: string; color: string }> = {
  prospect:    { label: "Prospect",    color: "bg-gray-100 text-gray-600" },
  negotiating: { label: "Negotiating", color: "bg-amber-100 text-amber-700" },
  active:      { label: "Active",      color: "bg-green-100 text-green-700" },
  churned:     { label: "Churned",     color: "bg-red-100 text-red-700" },
};

const EMPTY_FORM = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  customerType: "local" as "saas" | "local" | "enterprise" | "agency" | "offline",
  companyRegistrationNo: "",
  taxId: "",
  contactPersonName: "",
  contactPersonEmail: "",
  contactPersonPhone: "",
  industry: "",
  website: "",
  notes: "",
  linkedClerkUserId: "",
  dealStatus: "" as "" | "prospect" | "negotiating" | "active" | "churned",
  contractValue: "" as string,
  paymentTerms: "",
};

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dealFilter, setDealFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<Id<"saas_customers"> | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const customers = useQuery(api.saasCustomers.queries.getAllCustomers, {
    customerType: typeFilter === "all" ? undefined : typeFilter as any,
  });
  const stats = useQuery(api.saasCustomers.queries.getCustomerStats, {});
  const planMap = useQuery(api.adminUsers.getAdminUserPlanMap);

  const createCustomer = useMutation(api.saasCustomers.mutations.createCustomer);
  const updateCustomer = useMutation(api.saasCustomers.mutations.updateCustomer);
  const deleteCustomer = useMutation(api.saasCustomers.mutations.deleteCustomer);

  const planLookup = useMemo(() => {
    const m = new Map<string, string>();
    (planMap ?? []).forEach((p) => { if (p.ownerPlan) m.set(p.companyId, p.ownerPlan); });
    return m;
  }, [planMap]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    return customers.filter((c) => {
      const matchSearch =
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDeal = dealFilter === "all" || c.dealStatus === dealFilter;
      return matchSearch && matchDeal;
    });
  }, [customers, searchTerm, dealFilter]);

  const paginated = useMemo(
    () => filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [filtered, currentPage],
  );

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = (c: any) => {
    setFormData({
      customerName: c.customerName,
      customerEmail: c.customerEmail || "",
      customerPhone: c.customerPhone || "",
      customerAddress: c.customerAddress || "",
      customerType: c.customerType,
      companyRegistrationNo: c.companyRegistrationNo || "",
      taxId: c.taxId || "",
      contactPersonName: c.contactPersonName || "",
      contactPersonEmail: c.contactPersonEmail || "",
      contactPersonPhone: c.contactPersonPhone || "",
      industry: c.industry || "",
      website: c.website || "",
      notes: c.notes || "",
      linkedClerkUserId: c.linkedClerkUserId || "",
      dealStatus: c.dealStatus || "",
      contractValue: c.contractValue ? String(c.contractValue / 100) : "",
      paymentTerms: c.paymentTerms || "",
    });
    setEditingId(c._id);
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        customerPhone: formData.customerPhone || undefined,
        customerAddress: formData.customerAddress || undefined,
        customerType: formData.customerType,
        companyRegistrationNo: formData.companyRegistrationNo || undefined,
        taxId: formData.taxId || undefined,
        contactPersonName: formData.contactPersonName || undefined,
        contactPersonEmail: formData.contactPersonEmail || undefined,
        contactPersonPhone: formData.contactPersonPhone || undefined,
        industry: formData.industry || undefined,
        website: formData.website || undefined,
        notes: formData.notes || undefined,
        linkedClerkUserId: formData.linkedClerkUserId || undefined,
        dealStatus: (formData.dealStatus || undefined) as any,
        contractValue: formData.contractValue ? Math.round(parseFloat(formData.contractValue) * 100) : undefined,
        paymentTerms: formData.paymentTerms || undefined,
      };
      if (editingId) {
        await updateCustomer({ customerId: editingId, ...payload });
        toast.success("Customer updated");
      } else {
        await createCustomer(payload);
        toast.success("Customer created");
      }
      setShowDialog(false);
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id: Id<"saas_customers">) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await deleteCustomer({ customerId: id });
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const PLAN_BADGE: Record<string, string> = {
    pro_personal: "bg-blue-100 text-blue-800",
    business: "bg-purple-100 text-purple-800",
  };
  const PLAN_LABELS: Record<string, string> = { pro_personal: "Pro", business: "Business" };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Enterprise, agency, and offline billing clients</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats?.total ?? 0, icon: Users, bg: "bg-primary text-primary-foreground" },
          { label: "SaaS", value: stats?.saas ?? 0, icon: Building2, bg: "bg-primary/90 text-primary-foreground" },
          { label: "Local / Offline", value: (stats?.local ?? 0), icon: UserCheck, bg: "bg-primary/80 text-primary-foreground" },
          { label: "Inactive", value: stats?.inactive ?? 0, icon: UserX, bg: "bg-primary/70 text-primary-foreground" },
        ].map(({ label, value, icon: Icon, bg }) => (
          <Card key={label} className={`relative overflow-hidden border-0 shadow-lg ${bg}`}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
                <Icon className="h-4 w-4 opacity-70" />
              </div>
              <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            </CardContent>
            <div className="absolute -right-3 -bottom-3 opacity-10"><Icon className="h-20 w-20" /></div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, industry…" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dealFilter} onValueChange={(v) => { setDealFilter(v); setCurrentPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Deal Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="negotiating">Negotiating</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer Cards */}
      <div className="rounded-lg border bg-card">
        {!filtered || filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Add your first enterprise or offline client to get started</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {paginated.map((c) => {
                const typeMeta = TYPE_META[c.customerType] ?? TYPE_META.local;
                const dealMeta = c.dealStatus ? DEAL_META[c.dealStatus] : null;
                const linkedPlan = c.linkedClerkUserId ? planLookup.get(c.linkedClerkUserId) : null;
                return (
                  <div key={c._id} className="flex items-start justify-between p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${c.customerType === "enterprise" || c.customerType === "agency" ? "bg-purple-100" : c.customerType === "saas" ? "bg-blue-100" : "bg-emerald-100"}`}>
                        <Building2 className={`h-5 w-5 ${c.customerType === "enterprise" || c.customerType === "agency" ? "text-purple-600" : c.customerType === "saas" ? "text-blue-600" : "text-emerald-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm">{c.customerName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeMeta.color}`}>{typeMeta.label}</span>
                          {dealMeta && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dealMeta.color}`}>{dealMeta.label}</span>
                          )}
                          {linkedPlan && PLAN_BADGE[linkedPlan] && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[linkedPlan]}`}>{PLAN_LABELS[linkedPlan]}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {c.customerEmail && <p>{c.customerEmail}</p>}
                          {c.customerPhone && <p>{c.customerPhone}</p>}
                          <div className="flex items-center gap-3 flex-wrap pt-0.5">
                            {c.industry && <span className="text-xs">{c.industry}</span>}
                            {c.contractValue && (
                              <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                <Coins className="w-3 h-3" />${(c.contractValue / 100).toFixed(0)}/mo
                              </span>
                            )}
                            {c.paymentTerms && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.paymentTerms}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-4">
                      <Link href="/admin/invoices-and-pos">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                          <FileText className="h-3.5 w-3.5" />
                          Invoice
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(c)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(c._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-muted-foreground">
                <span>{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={(currentPage + 1) * PAGE_SIZE >= filtered.length} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>Enterprise, agency, or offline billing client</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basic Info</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Customer Name *</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData(p => ({ ...p, customerName: e.target.value }))} placeholder="Company or person name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={formData.customerType} onValueChange={(v: any) => setFormData(p => ({ ...p, customerType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Deal Status</Label>
                  <Select value={formData.dealStatus || "none"} onValueChange={(v) => setFormData(p => ({ ...p, dealStatus: v === "none" ? "" : v as any }))}>
                    <SelectTrigger><SelectValue placeholder="No status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No status</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData(p => ({ ...p, customerEmail: e.target.value }))} placeholder="billing@company.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={formData.customerPhone} onChange={(e) => setFormData(p => ({ ...p, customerPhone: e.target.value }))} placeholder="+1 555-0000" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Textarea value={formData.customerAddress} onChange={(e) => setFormData(p => ({ ...p, customerAddress: e.target.value }))} rows={2} placeholder="Billing address" />
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing & Contract</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Monthly Value (USD)</Label>
                  <Input type="number" step="0.01" min="0" value={formData.contractValue} onChange={(e) => setFormData(p => ({ ...p, contractValue: e.target.value }))} placeholder="e.g. 45.00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Terms</Label>
                  <Select value={formData.paymentTerms || "none"} onValueChange={(v) => setFormData(p => ({ ...p, paymentTerms: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="NET 7">NET 7</SelectItem>
                      <SelectItem value="NET 14">NET 14</SelectItem>
                      <SelectItem value="NET 30">NET 30</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reg. No.</Label>
                  <Input value={formData.companyRegistrationNo} onChange={(e) => setFormData(p => ({ ...p, companyRegistrationNo: e.target.value }))} placeholder="Company reg." />
                </div>
                <div className="space-y-1.5">
                  <Label>Tax ID / SST</Label>
                  <Input value={formData.taxId} onChange={(e) => setFormData(p => ({ ...p, taxId: e.target.value }))} placeholder="Tax ID" />
                </div>
              </div>
            </div>

            {/* System Account Link */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">System Account</h4>
              <div className="space-y-1.5">
                <Label>Linked Clerk User ID</Label>
                <Input value={formData.linkedClerkUserId} onChange={(e) => setFormData(p => ({ ...p, linkedClerkUserId: e.target.value }))} placeholder="user_xxxxxxxxxxxxxxxxxx" />
                <p className="text-xs text-muted-foreground">Copy from User Management → their Clerk ID. Links this customer record to their platform account.</p>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Person</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Name</Label>
                  <Input value={formData.contactPersonName} onChange={(e) => setFormData(p => ({ ...p, contactPersonName: e.target.value }))} placeholder="Contact person" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={formData.contactPersonEmail} onChange={(e) => setFormData(p => ({ ...p, contactPersonEmail: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={formData.contactPersonPhone} onChange={(e) => setFormData(p => ({ ...p, contactPersonPhone: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Other */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input value={formData.industry} onChange={(e) => setFormData(p => ({ ...p, industry: e.target.value }))} placeholder="e.g. Film Production" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={formData.website} onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Contract notes, deal context, special terms…" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.customerName}>{editingId ? "Update" : "Create"} Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

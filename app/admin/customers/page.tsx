"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Building2, Users } from "lucide-react";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Id<"saas_customers"> | null>(null);
  const [customerTypeFilter, setCustomerTypeFilter] = useState<"all" | "saas" | "local">("all");

  const customers = useQuery(api.saasCustomers.queries.getAllCustomers, {
    customerType: customerTypeFilter === "all" ? undefined : customerTypeFilter,
  });
  const stats = useQuery(api.saasCustomers.queries.getCustomerStats, {});
  
  const createCustomer = useMutation(api.saasCustomers.mutations.createCustomer);
  const updateCustomer = useMutation(api.saasCustomers.mutations.updateCustomer);
  const deleteCustomer = useMutation(api.saasCustomers.mutations.deleteCustomer);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerType: "local" as "saas" | "local",
    companyRegistrationNo: "",
    taxId: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    industry: "",
    website: "",
    notes: "",
  });

  const handleOpenDialog = (customerId?: Id<"saas_customers">) => {
    if (customerId && customers) {
      const customer = customers.find((c) => c._id === customerId);
      if (customer) {
        setFormData({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail || "",
          customerPhone: customer.customerPhone || "",
          customerAddress: customer.customerAddress || "",
          customerType: customer.customerType,
          companyRegistrationNo: customer.companyRegistrationNo || "",
          taxId: customer.taxId || "",
          contactPersonName: customer.contactPersonName || "",
          contactPersonEmail: customer.contactPersonEmail || "",
          contactPersonPhone: customer.contactPersonPhone || "",
          industry: customer.industry || "",
          website: customer.website || "",
          notes: customer.notes || "",
        });
        setEditingCustomer(customerId);
      }
    } else {
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        customerType: "local",
        companyRegistrationNo: "",
        taxId: "",
        contactPersonName: "",
        contactPersonEmail: "",
        contactPersonPhone: "",
        industry: "",
        website: "",
        notes: "",
      });
      setEditingCustomer(null);
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await updateCustomer({
          customerId: editingCustomer,
          ...formData,
        });
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(formData);
        toast.success("Customer created successfully");
      }
      setShowDialog(false);
    } catch (error) {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (customerId: Id<"saas_customers">) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer({ customerId });
        toast.success("Customer deleted successfully");
      } catch (error) {
        toast.error("Failed to delete customer");
      }
    }
  };

  const filteredCustomers = customers?.filter((customer) =>
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customerEmail && customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage SaaS and local customers for invoices and purchase orders</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SaaS Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.saas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Local Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.local || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactive || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={customerTypeFilter} onValueChange={(value: any) => setCustomerTypeFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="saas">SaaS Only</SelectItem>
                <SelectItem value="local">Local Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredCustomers && filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {customer.customerType === "saas" ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{customer.customerName}</h3>
                        <Badge variant={customer.customerType === "saas" ? "default" : "secondary"}>
                          {customer.customerType.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {customer.customerEmail && <p>📧 {customer.customerEmail}</p>}
                        {customer.customerPhone && <p>📞 {customer.customerPhone}</p>}
                        {customer.customerAddress && <p>📍 {customer.customerAddress}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(customer._id)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(customer._id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm mt-1">Create your first customer to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Create New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update customer information" : "Add a new customer for invoices and purchase orders"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Company or person name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerType">Customer Type *</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(value: "saas" | "local") => setFormData({ ...formData, customerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS Customer</SelectItem>
                      <SelectItem value="local">Local Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+60 12-345 6789"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Business Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyRegistrationNo">Registration No.</Label>
                  <Input
                    id="companyRegistrationNo"
                    value={formData.companyRegistrationNo}
                    onChange={(e) => setFormData({ ...formData, companyRegistrationNo: e.target.value })}
                    placeholder="Company registration number"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID / SST No.</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Tax identification number"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Technology, Retail"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Contact Person</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="contactPersonName">Name</Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPersonEmail">Email</Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    value={formData.contactPersonEmail}
                    onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPersonPhone">Phone</Label>
                  <Input
                    id="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                    placeholder="+60 12-345 6789"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this customer"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.customerName}>
              {editingCustomer ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

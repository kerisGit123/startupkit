"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const allLeads = useQuery(api.leads.getAllLeads, {
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteLead = useMutation(api.leads.deleteLead);
  const convertToClient = useMutation(api.leads.convertLeadToClient);

  const filteredLeads = allLeads?.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchLower))
    );
  });

  const handleDelete = async (leadId: Id<"leads">) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    try {
      await deleteLead({ leadId });
      toast.success("Lead deleted successfully");
    } catch (error) {
      toast.error("Failed to delete lead");
      console.error(error);
    }
  };

  const handleConvertToClient = async (leadId: Id<"leads">) => {
    if (!confirm("Convert this lead to a client?")) return;
    
    try {
      await convertToClient({ leadId });
      toast.success("Lead converted to client successfully");
    } catch (error) {
      toast.error("Failed to convert lead");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "default",
      contacted: "secondary",
      converted: "outline",
      lost: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
        <p className="text-gray-600">Manage and track your sales leads</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold">{allLeads?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">New</div>
          <div className="text-2xl font-bold text-blue-600">
            {allLeads?.filter((l) => l.status === "new").length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Contacted</div>
          <div className="text-2xl font-bold text-yellow-600">
            {allLeads?.filter((l) => l.status === "contacted").length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Converted</div>
          <div className="text-2xl font-bold text-green-600">
            {allLeads?.filter((l) => l.status === "converted").length || 0}
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads && filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow key={lead._id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-gray-600">
                    {lead.message || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lead.status !== "converted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToClient(lead._id)}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Convert
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(lead._id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "No leads found matching your filters"
                    : "No leads yet. They will appear here when created via the chatbot or API."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

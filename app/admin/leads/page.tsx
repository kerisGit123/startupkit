"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Search, UserPlus, Mail, Phone, Calendar, Trash2, ExternalLink, Send, User, Tag, BookOpen, Clock } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [viewingClientId, setViewingClientId] = useState<Id<"clients"> | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  // Fetch client detail when viewing
  const clientDetail = useQuery(
    api.bookingQueries.getClient,
    viewingClientId ? { id: viewingClientId } : "skip"
  );

  // Auto-open client dialog from URL param
  useEffect(() => {
    const clientParam = searchParams.get("client");
    if (clientParam) {
      setViewingClientId(clientParam as Id<"clients">);
      setClientDialogOpen(true);
    }
  }, [searchParams]);

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
      toast.success("Lead converted to client successfully! View in Customers page.");
    } catch (error) {
      toast.error("Failed to convert lead");
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Email sent to ${emailTo}`);
        setEmailDialogOpen(false);
        setEmailSubject("");
        setEmailBody("");
        setEmailTo("");
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const openEmailDialog = (email: string, name: string) => {
    setEmailTo(email);
    setEmailSubject(`Follow-up from our team`);
    setEmailBody(`Hi ${name},\n\nThank you for your interest. \n\nBest regards`);
    setEmailDialogOpen(true);
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEmailDialog(lead.email, lead.name)}
                        title="Send Email"
                      >
                        <Send className="w-3 h-3 text-blue-600" />
                      </Button>
                      {lead.status === "converted" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (lead.convertedToClientId) {
                              setViewingClientId(lead.convertedToClientId);
                              setClientDialogOpen(true);
                            }
                          }}
                          className="text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Client
                        </Button>
                      ) : (
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

      {/* Client Detail Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={(open) => { setClientDialogOpen(open); if (!open) setViewingClientId(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details
            </DialogTitle>
            <DialogDescription>
              Converted from lead — view client information and lifecycle
            </DialogDescription>
          </DialogHeader>
          {clientDetail ? (
            <div className="space-y-4 mt-2">
              {/* Lifecycle Status */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">LIFECYCLE:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Lead</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Client</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-400 border-gray-200">Subscriber</Badge>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                  <p className="font-semibold">{clientDetail.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                  <p className="text-sm">{clientDetail.email}</p>
                </div>
                {clientDetail.phone && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                    <p className="text-sm">{clientDetail.phone}</p>
                  </div>
                )}
                {clientDetail.company && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Company</p>
                    <p className="text-sm">{clientDetail.company}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {clientDetail.tags && clientDetail.tags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {clientDetail.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Stats */}
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Booking Statistics</p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{clientDetail.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">{clientDetail.completedAppointments}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="text-lg font-bold text-yellow-600">{clientDetail.cancelledAppointments}</p>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-lg font-bold text-red-600">{clientDetail.noShowCount}</p>
                    <p className="text-xs text-muted-foreground">No-Show</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-3 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Client Since</p>
                  <p className="text-sm">{new Date(clientDetail.createdAt).toLocaleDateString()}</p>
                </div>
                {clientDetail.lastBookedAt && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Last Booking</p>
                    <p className="text-sm">{new Date(clientDetail.lastBookedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {clientDetail.notes && (
                <div className="border-t pt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{clientDetail.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setClientDialogOpen(false); setViewingClientId(null); }}>Close</Button>
                <Button onClick={() => {
                  if (clientDetail.email) {
                    openEmailDialog(clientDetail.email, clientDetail.name);
                    setClientDialogOpen(false);
                  }
                }}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          ) : viewingClientId ? (
            <div className="py-8 text-center text-muted-foreground">Loading client details...</div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Client not found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email to Lead</DialogTitle>
            <DialogDescription>
              Send an email to {emailTo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input value={emailTo} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your email..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
              >
                <Mail className="w-4 h-4 mr-2" />
                {emailSending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Send, Pause, Trash2, Search,
  Mail, Eye, Code, MousePointer, BarChart3, Loader2,
} from "lucide-react";
import { useState } from "react";
import { CampaignCreatorDialog } from "@/components/email/CampaignCreatorDialog";
import { toast } from "sonner";

type StatusFilter = "all" | "draft" | "scheduled" | "sending" | "sent" | "failed";

export default function EmailCampaignsPage() {
  const campaigns = useQuery(api.emails.campaigns.listCampaigns);
  const templates = useQuery(api.emails.templates.listTemplates);
  const sendCampaign = useMutation(api.emails.campaigns.sendCampaign);
  const pauseCampaign = useMutation(api.emails.campaigns.pauseCampaign);
  const deleteCampaign = useMutation(api.emails.campaigns.deleteCampaign);

  const [showCreator, setShowCreator] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  const filteredCampaigns = campaigns?.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: campaigns?.length || 0,
    draft: campaigns?.filter((c) => c.status === "draft").length || 0,
    scheduled: campaigns?.filter((c) => c.status === "scheduled").length || 0,
    sending: campaigns?.filter((c) => c.status === "sending").length || 0,
    sent: campaigns?.filter((c) => c.status === "sent").length || 0,
    failed: campaigns?.filter((c) => c.status === "failed").length || 0,
  };

  const totalSent = campaigns?.reduce((sum, c) => sum + c.sentCount, 0) || 0;
  const totalOpened = campaigns?.reduce((sum, c) => sum + c.openedCount, 0) || 0;
  const totalClicked = campaigns?.reduce((sum, c) => sum + c.clickedCount, 0) || 0;
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

  const formatDateTime = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const handleSend = async (campaignId: string) => {
    try {
      await sendCampaign({ campaignId: campaignId as any, testMode: false });
      toast.success("Campaign sent successfully");
    } catch { toast.error("Failed to send campaign"); }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await pauseCampaign({ campaignId: campaignId as any });
      toast.success("Campaign paused");
    } catch { toast.error("Failed to pause campaign"); }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await deleteCampaign({ campaignId: campaignId as any });
      toast.success("Campaign deleted");
    } catch { toast.error("Failed to delete campaign"); }
  };

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
    scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    sending: { label: "Sending", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
    sent: { label: "Sent", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
    failed: { label: "Failed", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  };

  if (campaigns === undefined) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Total Sent</p>
                <p className="text-2xl font-bold mt-1">{totalSent.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Avg Open Rate</p>
                <p className="text-2xl font-bold mt-1">{avgOpenRate}%</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Avg Click Rate</p>
                <p className="text-2xl font-bold mt-1">{avgClickRate}%</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Campaigns</p>
                <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-48 shrink-0 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">View by Status</p>
          {(["all", "draft", "scheduled", "sending", "sent", "failed"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <span className="capitalize">{status === "all" ? "All Campaigns" : status}</span>
              <span className={`text-xs font-medium ${statusFilter === status ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Campaign List - Table Style */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Campaign</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase">Opens</th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase">Clicks</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns && filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign) => {
                    const openRate = campaign.sentCount > 0 ? Math.round((campaign.openedCount / campaign.sentCount) * 100) : 0;
                    const clickRate = campaign.sentCount > 0 ? Math.round((campaign.clickedCount / campaign.sentCount) * 100) : 0;
                    const sc = statusConfig[campaign.status] || statusConfig.draft;
                    const template = templates?.find((t) => t._id === campaign.templateId);

                    return (
                      <tr key={campaign._id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {template ? template.name : "Unknown template"}
                              {" · "}
                              {campaign.sentAt
                                ? formatDate(campaign.sentAt)
                                : campaign.scheduledAt
                                ? `Scheduled ${formatDateTime(campaign.scheduledAt)}`
                                : "Not sent"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.totalRecipients} recipient{campaign.totalRecipients !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <p className="text-sm font-semibold">{openRate}%</p>
                          <p className="text-xs text-muted-foreground">{campaign.openedCount} opens</p>
                        </td>
                        <td className="p-3 text-center">
                          <p className="text-sm font-semibold">{clickRate}%</p>
                          <p className="text-xs text-muted-foreground">{campaign.clickedCount} clicks</p>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => { setPreviewCampaign(campaign); setPreviewTemplate(template || null); }} title="Preview">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {(campaign.status === "draft" || campaign.status === "scheduled") && (
                              <Button variant="outline" size="sm" onClick={() => handleSend(campaign._id)} title="Send Now">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {campaign.status === "sending" && (
                              <Button variant="outline" size="sm" onClick={() => handlePause(campaign._id)} title="Pause">
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {campaign.status === "sent" && (
                              <Button variant="outline" size="sm" onClick={() => handleSend(campaign._id)} title="Resend">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(campaign._id)} title="Delete" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      {searchQuery || statusFilter !== "all" ? (
                        <div>
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p>No campaigns match your filters</p>
                          <Button variant="link" size="sm" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                            Clear filters
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No campaigns yet</p>
                          <p className="text-sm mt-1">Create your first email campaign to get started</p>
                          <Button className="mt-3" onClick={() => setShowCreator(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreator && (
        <CampaignCreatorDialog onClose={() => setShowCreator(false)} />
      )}

      {/* Preview Campaign Dialog */}
      <Dialog open={!!previewCampaign} onOpenChange={() => { setPreviewCampaign(null); setPreviewTemplate(null); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Campaign Preview: {previewCampaign?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="preview" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code className="h-4 w-4" />
                HTML Code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 overflow-auto border rounded-lg mt-2">
              {previewTemplate ? (
                <iframe
                  srcDoc={previewTemplate.html || previewTemplate.htmlBody || "<p>No HTML content</p>"}
                  className="w-full h-[60vh] border-0"
                  title="Campaign Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                  <p>Template not found for this campaign</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="code" className="flex-1 overflow-auto mt-2">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto h-[60vh] whitespace-pre-wrap break-all">
                <code>{previewTemplate?.html || previewTemplate?.htmlBody || "No HTML content"}</code>
              </pre>
            </TabsContent>
          </Tabs>
          {previewCampaign && (
            <div className="grid grid-cols-5 gap-3 pt-3 border-t text-center">
              <div>
                <p className="text-xs text-muted-foreground">Recipients</p>
                <p className="font-semibold">{previewCampaign.totalRecipients}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="font-semibold">{previewCampaign.sentCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opened</p>
                <p className="font-semibold">{previewCampaign.openedCount} ({previewCampaign.sentCount > 0 ? Math.round((previewCampaign.openedCount / previewCampaign.sentCount) * 100) : 0}%)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clicked</p>
                <p className="font-semibold">{previewCampaign.clickedCount} ({previewCampaign.sentCount > 0 ? Math.round((previewCampaign.clickedCount / previewCampaign.sentCount) * 100) : 0}%)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="font-semibold text-red-600">{previewCampaign.failedCount}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

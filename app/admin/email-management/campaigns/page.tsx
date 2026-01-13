"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Pause, Play, Eye } from "lucide-react";
import { useState } from "react";
import { CampaignCreatorDialog } from "@/components/email/CampaignCreatorDialog";
import { toast } from "sonner";

export default function EmailCampaignsPage() {
  const campaigns = useQuery(api.emails.campaigns.listCampaigns);
  const pauseCampaign = useMutation(api.emails.campaigns.pauseCampaign);
  const resumeCampaign = useMutation(api.emails.campaigns.resumeCampaign);
  
  const [showCreator, setShowCreator] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      scheduled: "default",
      sending: "default",
      sent: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePause = async (campaignId: string) => {
    try {
      await pauseCampaign({ campaignId: campaignId as any });
      toast.success("Campaign paused");
    } catch {
      toast.error("Failed to pause campaign");
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await resumeCampaign({ campaignId: campaignId as any });
      toast.success("Campaign resumed");
    } catch {
      toast.error("Failed to resume campaign");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage email campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.scheduledAt 
                      ? `Scheduled for ${formatDate(campaign.scheduledAt)}`
                      : campaign.sentAt
                      ? `Sent on ${formatDate(campaign.sentAt)}`
                      : "Draft"}
                  </p>
                </div>
                {getStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{campaign.sentCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opened</p>
                  <p className="text-2xl font-bold">
                    {campaign.openedCount}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({campaign.sentCount > 0 
                        ? Math.round((campaign.openedCount / campaign.sentCount) * 100)
                        : 0}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                  <p className="text-2xl font-bold">
                    {campaign.clickedCount}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({campaign.sentCount > 0 
                        ? Math.round((campaign.clickedCount / campaign.sentCount) * 100)
                        : 0}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{campaign.failedCount}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {campaign.status === "sending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePause(campaign._id)}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {campaign.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResume(campaign._id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreator && (
        <CampaignCreatorDialog onClose={() => setShowCreator(false)} />
      )}
    </div>
  );
}

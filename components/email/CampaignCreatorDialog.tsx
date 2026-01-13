"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CampaignCreatorDialogProps {
  onClose: () => void;
}

export function CampaignCreatorDialog({ onClose }: CampaignCreatorDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [recipientType, setRecipientType] = useState("all_users");
  const [userLabel, setUserLabel] = useState("");
  const [specificEmail, setSpecificEmail] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const templates = useQuery(api.emails.templates.listTemplates);
  const createCampaign = useMutation(api.emails.campaigns.createCampaign);
  const sendCampaign = useMutation(api.emails.campaigns.sendCampaign);

  const handleCreate = async (sendNow: boolean) => {
    try {
      const campaignId = await createCampaign({
        name,
        templateId: templateId as any,
        recipientType: recipientType as any,
        userLabel: recipientType === "user_label" ? userLabel : undefined,
        recipientIds: recipientType === "specific_users" ? [specificEmail] : undefined,
        scheduledAt: sendNow ? undefined : scheduledAt ? new Date(scheduledAt).getTime() : undefined,
      });

      if (sendNow) {
        await sendCampaign({ campaignId });
        toast.success("Campaign sent successfully");
      } else {
        toast.success("Campaign created successfully");
      }
      
      onClose();
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 2: {step === 1 ? "Basic Info & Template" : "Recipients & Schedule"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Newsletter - January 2026"
              />
            </div>
            <div>
              <Label>Select Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name} {template.category && `(${template.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name || !templateId}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Recipients</Label>
              <RadioGroup value={recipientType} onValueChange={setRecipientType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_users" id="all" />
                  <Label htmlFor="all">All Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific_users" id="specific" />
                  <Label htmlFor="specific">Specific User by Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active_7_days" id="active7" />
                  <Label htmlFor="active7">Last 7 Days Active Subscribers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive_1_month" id="inactive1" />
                  <Label htmlFor="inactive1">1 Month Inactive Subscribers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user_label" id="label" />
                  <Label htmlFor="label">Users by Label</Label>
                </div>
              </RadioGroup>
              {recipientType === "specific_users" && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter user email address"
                    type="email"
                    value={specificEmail}
                    onChange={(e) => setSpecificEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    System will find the user by email address
                  </p>
                </div>
              )}
              {recipientType === "user_label" && (
                <div className="mt-2">
                  <Input
                    placeholder="Enter user label"
                    value={userLabel}
                    onChange={(e) => setUserLabel(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to send immediately
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleCreate(false)}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleCreate(!scheduledAt)}>
                  {scheduledAt ? "Schedule" : "Send Now"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

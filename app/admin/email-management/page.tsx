"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Loader2, Mail, FileText, Send, BarChart3, Sparkles, Eye, EyeOff, Copy, Edit, X, Plus, Trash2, MousePointer, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TemplateEditorDialog } from "@/components/email/TemplateEditorDialog";
import { CampaignCreatorDialog } from "@/components/email/CampaignCreatorDialog";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState("settings");
  const emailSettings = useQuery(api.platformConfig.getByCategory, { category: "email" });
  const batchSet = useMutation(api.platformConfig.batchSet);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [testEmail, setTestEmail] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatingAllTemplates, setGeneratingAllTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedHtml, setEditedHtml] = useState("");
  
  const sendTestEmail = useAction(api.emails.testEmail.sendTestEmail);
  const generateAllTemplates = useMutation(api.emails.defaultTemplates.generateAllDefaultTemplates);
  const generateDefaultCustomTemplates = useMutation(api.emails.defaultCustomTemplates.generateDefaultCustomTemplates);
  const fixTemplateCategories = useMutation(api.emails.fixTemplates.fixTemplateCategories);
  const templatesByTypes = useQuery(api.emails.defaultTemplates.getTemplatesByTypes);
  const updateTemplate = useMutation(api.emails.defaultTemplates.updateTemplate);

  // New email management queries and mutations
  const templates = useQuery(api.emails.templates.listTemplates);
  const deleteTemplate = useMutation(api.emails.templates.deleteTemplate);
  const duplicateTemplate = useMutation(api.emails.templates.duplicateTemplate);
  const campaigns = useQuery(api.emails.campaigns.listCampaigns);
  const sendCampaign = useMutation(api.emails.campaigns.sendCampaign);
  const pauseCampaign = useMutation(api.emails.campaigns.pauseCampaign);
  const resumeCampaign = useMutation(api.emails.campaigns.resumeCampaign);
  const deleteCampaign = useMutation(api.emails.campaigns.deleteCampaign);
  const analyticsStats = useQuery(api.emails.analytics.getOverallStats);
  const topCampaigns = useQuery(api.emails.analytics.getTopCampaigns);
  const performanceData = useQuery(api.emails.analytics.getPerformanceOverTime);

  // Email logs queries and mutations
  const emailLogs = useQuery(api.emails.emailLogs.listEmailLogs);
  const deleteEmailLog = useMutation(api.emails.emailLogs.deleteEmailLog);
  const clearAllEmailLogs = useMutation(api.emails.emailLogs.clearAllEmailLogs);
  const emailLogsStats = useQuery(api.emails.emailLogs.getEmailLogsStats);

  // Variable management queries and mutations
  const variablesByGroup = useQuery(api.emails.variables.getVariablesByGroup);
  const saveVariable = useMutation(api.emails.variables.saveVariable);
  const deleteVariable = useMutation(api.emails.variables.deleteVariable);
  const generateDefaultVariables = useMutation(api.emails.variables.generateDefaultVariables);

  // Template management state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Campaign management state
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "system" | "custom">("all");

  // Email logs state
  const [previewingLog, setPreviewingLog] = useState<any>(null);
  const [showLogPreview, setShowLogPreview] = useState(false);
  const [showLogCodePreview, setShowLogCodePreview] = useState(false);

  // Variable settings state
  const [selectedVariableGroup, setSelectedVariableGroup] = useState("global");
  const [editedVariables, setEditedVariables] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [settings, setSettings] = useState({
    emailEnabled: false,
    useSystemNotification: false,
    sendWelcomeEmail: true,
    sendPasswordResetEmail: true,
    sendSubscriptionEmails: true,
    sendPaymentNotifications: true,
    sendUsageAlerts: true,
    sendAdminNotifications: true,
    resendApiKey: "",
    emailFromName: "",
    emailFromAddress: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync settings from query data once
  if (emailSettings && !isInitialized) {
    setSettings({
      emailEnabled: (emailSettings.emailEnabled as boolean) ?? false,
      useSystemNotification: (emailSettings.useSystemNotification as boolean) ?? false,
      sendWelcomeEmail: (emailSettings.sendWelcomeEmail as boolean) ?? true,
      sendPasswordResetEmail: (emailSettings.sendPasswordResetEmail as boolean) ?? true,
      sendSubscriptionEmails: (emailSettings.sendSubscriptionEmails as boolean) ?? true,
      sendPaymentNotifications: (emailSettings.sendPaymentNotifications as boolean) ?? true,
      sendUsageAlerts: (emailSettings.sendUsageAlerts as boolean) ?? true,
      sendAdminNotifications: (emailSettings.sendAdminNotifications as boolean) ?? true,
      resendApiKey: (emailSettings.resendApiKey as string) ?? "",
      emailFromName: (emailSettings.emailFromName as string) ?? "",
      emailFromAddress: (emailSettings.emailFromAddress as string) ?? "",
    });
    setIsInitialized(true);
  }

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await batchSet({
        settings: [
          { key: "emailEnabled", value: settings.emailEnabled, category: "email", description: "Master email toggle", isEncrypted: false },
          { key: "useSystemNotification", value: settings.useSystemNotification, category: "email", description: "System notification (test mode)", isEncrypted: false },
          { key: "sendWelcomeEmail", value: settings.sendWelcomeEmail, category: "email", description: "Send welcome emails", isEncrypted: false },
          { key: "sendPasswordResetEmail", value: settings.sendPasswordResetEmail, category: "email", description: "Send password reset emails", isEncrypted: false },
          { key: "sendSubscriptionEmails", value: settings.sendSubscriptionEmails, category: "email", description: "Send subscription emails", isEncrypted: false },
          { key: "sendPaymentNotifications", value: settings.sendPaymentNotifications, category: "email", description: "Send payment notifications", isEncrypted: false },
          { key: "sendUsageAlerts", value: settings.sendUsageAlerts, category: "email", description: "Send usage alerts", isEncrypted: false },
          { key: "sendAdminNotifications", value: settings.sendAdminNotifications, category: "email", description: "Send admin notifications", isEncrypted: false },
          { key: "resendApiKey", value: settings.resendApiKey, category: "email", description: "Resend API key", isEncrypted: true },
          { key: "emailFromName", value: settings.emailFromName, category: "email", description: "Sender name", isEncrypted: false },
          { key: "emailFromAddress", value: settings.emailFromAddress, category: "email", description: "Sender email", isEncrypted: false },
        ],
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save email settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }
    
    // Allow test mode even without API key configured
    if (!settings.useSystemNotification && (!settings.resendApiKey || !settings.emailFromName || !settings.emailFromAddress)) {
      toast.error("Please configure Resend settings first or enable System Notification (test mode)");
      return;
    }
    
    setTestEmailStatus("sending");
    try {
      const result = await sendTestEmail({
        to: testEmail,
        resendApiKey: settings.resendApiKey || "",
        fromName: settings.emailFromName || "Test",
        fromEmail: settings.emailFromAddress || "test@example.com",
        useTestMode: settings.useSystemNotification,
      });
      
      if (result.success) {
        setTestEmailStatus("success");
        if (settings.useSystemNotification) {
          toast.success("Test email logged to database (test mode)!");
        } else {
          toast.success("Test email sent successfully!");
        }
        setTimeout(() => setTestEmailStatus("idle"), 3000);
      } else {
        setTestEmailStatus("error");
        toast.error(result.error || "Failed to send test email");
        setTimeout(() => setTestEmailStatus("idle"), 3000);
      }
    } catch {
      setTestEmailStatus("error");
      toast.error("Failed to send test email");
      setTimeout(() => setTestEmailStatus("idle"), 3000);
    }
  };
  
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(settings.resendApiKey);
    toast.success("API key copied to clipboard!");
  };
  
  const handleGenerateAllTemplates = async () => {
    setGeneratingAllTemplates(true);
    try {
      // First fix any existing templates with wrong category
      await fixTemplateCategories();
      
      // Then generate/update templates
      const result = await generateAllTemplates();
      
      if (result.success) {
        toast.success(`Successfully generated all ${result.generated} system templates!`);
      } else {
        toast.warning(`Generated ${result.generated} of ${result.total} templates. Some failed.`);
      }
    } catch {
      toast.error("Failed to generate system templates");
    } finally {
      setGeneratingAllTemplates(false);
    }
  };

  const handleGenerateDefaultCustomTemplates = async () => {
    setGeneratingAllTemplates(true);
    try {
      const result = await generateDefaultCustomTemplates();
      
      if (result.success) {
        toast.success(`Successfully generated ${result.generated} default templates!`);
      } else {
        toast.warning(`Generated ${result.generated} of ${result.total} templates. Some failed.`);
      }
    } catch {
      toast.error("Failed to generate default templates");
    } finally {
      setGeneratingAllTemplates(false);
    }
  };
  
  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditedSubject(template.subject);
    setEditedHtml(template.html || template.htmlBody || "");
  };
  
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate({
        id: editingTemplate._id,
        subject: editedSubject,
        html: editedHtml,
        htmlBody: editedHtml,
      });
      toast.success("Template updated successfully!");
      setEditingTemplate(null);
    } catch {
      toast.error("Failed to update template");
    }
  };
  
  const replaceVariablesWithSampleData = (html: string, subject: string) => {
    const sampleData: Record<string, string> = {
      user_name: "John Doe",
      company_name: "StartupKit",
      company_email: "support@startupkit.com",
      current_year: new Date().getFullYear().toString(),
      login_link: "https://app.startupkit.com/login",
      reset_password_link: "https://app.startupkit.com/reset-password",
      invoiceNo: "INV-2026-001",
      subscription_plan: "Pro Plan",
      amount: "$29.99",
      subscription_status: "Active",
      next_billing_date: "February 13, 2026",
      payment_amount: "$29.99",
      credits_purchased: "1000",
      payment_date: "January 13, 2026",
      payment_method: "Visa ****1234",
      invoice_link: "https://app.startupkit.com/invoices/001",
      usage_amount: "850",
      usage_limit: "1000",
      usage_percentage: "85%",
      notification_type: "System Alert",
      notification_priority: "High",
      notification_time: new Date().toLocaleString(),
      notification_message: "Your account requires attention",
      admin_dashboard_link: "https://app.startupkit.com/admin",
      shop_link: "https://shop.startupkit.com",
      product_name: "Premium Package",
      discount_percentage: "25",
      promo_code: "SAVE25",
      expiry_date: "January 31, 2026",
      month: new Date().toLocaleString('default', { month: 'long' }),
      article_1_title: "New Feature Launch",
      article_1_summary: "We've launched an amazing new feature...",
      article_1_link: "https://blog.startupkit.com/new-feature",
      article_2_title: "Product Updates",
      article_2_summary: "Check out our latest improvements...",
      article_2_link: "https://blog.startupkit.com/updates",
      article_3_title: "Customer Success Story",
      article_3_summary: "See how our customers are succeeding...",
      article_3_link: "https://blog.startupkit.com/success",
      unsubscribe_link: "https://app.startupkit.com/unsubscribe",
      feature_1: "Advanced Analytics Dashboard",
      feature_2: "Real-time Collaboration",
      feature_3: "AI-Powered Insights",
      feature_name: "Smart Automation",
      feature_description: "Automate your workflows with AI-powered tools",
      benefit_1: "Save 10+ hours per week",
      benefit_2: "Increase productivity by 40%",
      benefit_3: "Reduce manual errors",
      feature_link: "https://app.startupkit.com/features/automation",
      support_email: "support@startupkit.com",
      event_name: "Product Launch Webinar",
      event_location: "Online (Zoom)",
      event_date: "January 25, 2026",
      event_time: "2:00 PM EST",
      attendee_count: "500+",
      event_description: "Join us for an exclusive look at our latest product updates",
      rsvp_link: "https://app.startupkit.com/events/rsvp",
      rsvp_deadline: "January 20, 2026",
      survey_duration: "2 minutes",
      survey_topic: "your experience with StartupKit",
      incentive: "$10 Account Credit",
      survey_link: "https://survey.startupkit.com/feedback",
      survey_deadline: "January 31, 2026",
    };

    let replacedHtml = html;
    let replacedSubject = subject;

    for (const [key, value] of Object.entries(sampleData)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      replacedHtml = replacedHtml.replace(regex, value);
      replacedSubject = replacedSubject.replace(regex, value);
    }

    return { html: replacedHtml, subject: replacedSubject };
  };

  const handlePreviewTemplate = (template: any) => {
    const { html, subject } = replaceVariablesWithSampleData(
      template.html || template.htmlBody || "",
      template.subject || ""
    );
    setPreviewingTemplate({ ...template, html, htmlBody: html, subject });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate({ templateId: templateId as any });
        toast.success("Template deleted successfully");
      } catch {
        toast.error("Failed to delete template");
      }
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplate({ templateId: templateId as any });
      toast.success("Template duplicated successfully");
    } catch {
      toast.error("Failed to duplicate template");
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await pauseCampaign({ campaignId: campaignId as any });
      toast.success("Campaign paused");
    } catch {
      toast.error("Failed to pause campaign");
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      // Use testMode based on System Notification setting
      await sendCampaign({ 
        campaignId: campaignId as any,
        testMode: settings.useSystemNotification 
      });
      
      if (settings.useSystemNotification) {
        toast.success("Campaign logged to database (test mode)");
      } else {
        toast.success("Campaign sent successfully");
      }
    } catch {
      toast.error("Failed to send campaign");
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await resumeCampaign({ campaignId: campaignId as any });
      toast.success("Campaign resumed");
    } catch {
      toast.error("Failed to resume campaign");
    }
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

  if (emailSettings === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Email Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage all your email settings, templates, campaigns, and analytics in one place
          </p>
        </div>
        <Button 
          onClick={handleGenerateDefaultCustomTemplates}
          disabled={generatingAllTemplates}
        >
          {generatingAllTemplates ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Default Templates
            </>
          )}
        </Button>
      </div>

      {saveStatus === "success" && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings" className="gap-2">
            <Mail className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Email Logs
          </TabsTrigger>
          <TabsTrigger value="variables" className="gap-2">
            <Edit className="h-4 w-4" />
            Variables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Master Email Control</CardTitle>
              <CardDescription>Enable or disable all email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailEnabled" className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Master switch for all email notifications</p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Notification (Testing)</CardTitle>
              <CardDescription>Log emails to database instead of sending via Resend - for testing purposes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useSystemNotification" className="text-base font-medium">System Notification</Label>
                  <p className="text-sm text-muted-foreground">When enabled, emails are logged to database instead of being sent. Perfect for testing variable replacement.</p>
                </div>
                <Switch
                  id="useSystemNotification"
                  checked={settings.useSystemNotification}
                  onCheckedChange={(checked) => setSettings({ ...settings, useSystemNotification: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Types</CardTitle>
                  <CardDescription>Control which types of emails to send</CardDescription>
                </div>
                <Button
                  onClick={handleGenerateAllTemplates}
                  disabled={generatingAllTemplates}
                  size="sm"
                >
                  {generatingAllTemplates ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate System Templates
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="welcomeEmail" className="font-medium">Welcome Emails</Label>
                  <p className="text-sm text-muted-foreground">Send welcome emails to new users</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.welcome && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.welcome)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.welcome)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="welcomeEmail"
                    checked={settings.sendWelcomeEmail}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendWelcomeEmail: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="passwordReset" className="font-medium">Password Reset</Label>
                  <p className="text-sm text-muted-foreground">Send password reset emails</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.password_reset && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.password_reset)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.password_reset)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="passwordReset"
                    checked={settings.sendPasswordResetEmail}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendPasswordResetEmail: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="subscriptionEmails" className="font-medium">Subscription Emails</Label>
                  <p className="text-sm text-muted-foreground">Send subscription-related emails</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.subscription && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.subscription)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.subscription)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="subscriptionEmails"
                    checked={settings.sendSubscriptionEmails}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendSubscriptionEmails: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="paymentNotifications" className="font-medium">Payment Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send payment-related notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.payment && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.payment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.payment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="paymentNotifications"
                    checked={settings.sendPaymentNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendPaymentNotifications: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="usageAlerts" className="font-medium">Usage Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send usage alert notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.usage_alert && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.usage_alert)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.usage_alert)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="usageAlerts"
                    checked={settings.sendUsageAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendUsageAlerts: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="adminNotifications" className="font-medium">Admin Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send admin notifications</p>
                </div>
                <div className="flex items-center gap-2">
                  {templatesByTypes?.admin_notification && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(templatesByTypes.admin_notification)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(templatesByTypes.admin_notification)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </>
                  )}
                  <Switch
                    id="adminNotifications"
                    checked={settings.sendAdminNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendAdminNotifications: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resend Configuration</CardTitle>
              <CardDescription>Configure your Resend API settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resendApiKey">Resend API Key</Label>
                <div className="relative">
                  <Input
                    id="resendApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="re_..."
                    value={settings.resendApiKey}
                    onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyApiKey}
                      disabled={!settings.resendApiKey}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  placeholder="Your SaaS"
                  value={settings.emailFromName}
                  onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={settings.emailFromAddress}
                  onChange={(e) => setSettings({ ...settings, emailFromAddress: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Email</CardTitle>
              <CardDescription>Send a test email to verify your configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleTestEmail} 
                variant="outline" 
                className="w-full gap-2"
                disabled={testEmailStatus === "sending"}
              >
                {testEmailStatus === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={saveStatus === "saving"}
            className="w-full"
            size="lg"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Tabs defaultValue="system" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="system">System Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom Templates</TabsTrigger>
              </TabsList>
              <Button onClick={() => { setSelectedTemplate(null); setShowTemplateEditor(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Template
              </Button>
            </div>

            <TabsContent value="system" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.filter(t => t.category === "system").map((template) => (
                  <Card key={template._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.subject}
                          </CardDescription>
                        </div>
                        <Badge variant="default">system</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.variables.map((variable: string) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedTemplate(template); setShowTemplatePreview(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedTemplate(template); setShowTemplateEditor(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template._id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {templates?.filter(t => t.category === "system").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No system templates found.</p>
                  <p className="text-sm mt-2">Click &quot;Generate Default Templates&quot; to create them.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.filter(t => t.category === "custom" || t.category === "campaign").map((template) => (
              <Card key={template._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.subject}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {template.category || "custom"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.variables.map((variable: string) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedTemplate(template); setShowTemplatePreview(true); }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedTemplate(template); setShowTemplateEditor(true); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template._id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
              {templates?.filter(t => t.category === "custom" || t.category === "campaign").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No custom templates yet.</p>
                  <p className="text-sm mt-2">Click &quot;Create Custom Template&quot; to get started.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Email Campaigns</h2>
              <p className="text-muted-foreground">Create and manage email campaigns</p>
            </div>
            <Button onClick={() => setShowCampaignCreator(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns by name..."
                value={campaignSearchQuery}
                onChange={(e) => setCampaignSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value as "all" | "system" | "custom")}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Templates</option>
              <option value="system">System Templates</option>
              <option value="custom">Custom Templates</option>
            </select>
          </div>

          <div className="space-y-4">
            {campaigns?.filter((campaign) => {
              // Filter by search query
              const matchesSearch = campaign.name.toLowerCase().includes(campaignSearchQuery.toLowerCase());
              
              // Filter by template type
              const template = templates?.find(t => t._id === campaign.templateId);
              const matchesFilter = 
                campaignFilter === "all" ||
                (campaignFilter === "system" && template?.category === "system") ||
                (campaignFilter === "custom" && (template?.category === "custom" || template?.category === "campaign"));
              
              return matchesSearch && matchesFilter;
            }).map((campaign) => (
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
                      <div className="flex gap-2 mt-2">
                        {(() => {
                          const template = templates?.find(t => t._id === campaign.templateId);
                          return template ? (
                            <>
                              <Badge variant="outline">{template.name}</Badge>
                              {template.category && <Badge variant="secondary">{template.category}</Badge>}
                            </>
                          ) : null;
                        })()}
                      </div>
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
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const template = templates?.find(t => t._id === campaign.templateId);
                        if (template) {
                          setPreviewingTemplate(template);
                        } else {
                          toast.error("Template not found");
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Template
                    </Button>
                    {(campaign.status === "draft" || campaign.status === "scheduled") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const template = templates?.find(t => t._id === campaign.templateId);
                            if (template) {
                              handleEditTemplate(template);
                            } else {
                              toast.error("Template not found");
                            }
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendCampaign(campaign._id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {settings.useSystemNotification ? "Test Send (Log Only)" : "Send Now"}
                        </Button>
                      </>
                    )}
                    {campaign.status === "sending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseCampaign(campaign._id)}
                      >
                        Pause
                      </Button>
                    )}
                    {campaign.status === "sent" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign._id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Resend
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this campaign?")) {
                          try {
                            await deleteCampaign({ campaignId: campaign._id as any });
                            toast.success("Campaign deleted successfully");
                          } catch {
                            toast.error("Failed to delete campaign");
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="text-red-600">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsStats?.totalSent || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsStats?.openRate ? `${analyticsStats.openRate.toFixed(1)}%` : "0%"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsStats?.clickRate ? `${analyticsStats.clickRate.toFixed(1)}%` : "0%"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsStats?.totalCampaigns || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData && performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                    <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke="#ffc658" name="Clicked" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No performance data available yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {topCampaigns && topCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {topCampaigns.map((campaign) => (
                    <div key={campaign._id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.sentCount} sent
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{campaign.openRate.toFixed(1)}% open</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.clickRate.toFixed(1)}% click
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No campaigns sent yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Logs</CardTitle>
                  <CardDescription>View all logged emails for testing and debugging</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Are you sure you want to clear all email logs?")) {
                      try {
                        await clearAllEmailLogs({});
                        toast.success("All email logs cleared");
                      } catch {
                        toast.error("Failed to clear logs");
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailLogsStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Logs</div>
                    <div className="text-2xl font-bold">{emailLogsStats.total}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Logged (Test)</div>
                    <div className="text-2xl font-bold text-blue-600">{emailLogsStats.logged}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Sent</div>
                    <div className="text-2xl font-bold text-green-600">{emailLogsStats.sent}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-2xl font-bold text-red-600">{emailLogsStats.failed}</div>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Date & Time</th>
                      <th className="p-3 text-left text-sm font-medium">Recipient</th>
                      <th className="p-3 text-left text-sm font-medium">Subject</th>
                      <th className="p-3 text-left text-sm font-medium">Template</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs && emailLogs.length > 0 ? (
                      emailLogs.map((log: any) => (
                        <tr key={log._id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-3 text-sm font-medium">
                            {log.sentTo}
                          </td>
                          <td className="p-3 text-sm">
                            {log.subject}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant="outline">{log.templateType || "custom"}</Badge>
                          </td>
                          <td className="p-3 text-sm">
                            {log.status === "logged" && <Badge variant="secondary">Logged</Badge>}
                            {log.status === "sent" && <Badge variant="default">Sent</Badge>}
                            {log.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewingLog(log);
                                  setShowLogPreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewingLog(log);
                                  setShowLogCodePreview(true);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Preview Code
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (confirm("Delete this email log?")) {
                                    try {
                                      await deleteEmailLog({ logId: log._id });
                                      toast.success("Log deleted");
                                    } catch {
                                      toast.error("Failed to delete log");
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No email logs yet. Enable System Notification and send a campaign to see logs here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Variable Settings</CardTitle>
                  <CardDescription>Manage email template variables stored in platform configuration</CardDescription>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const result = await generateDefaultVariables({});
                      toast.success(`Generated ${result.created} variables, skipped ${result.skipped} existing`);
                    } catch {
                      toast.error("Failed to generate variables");
                    }
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto Generate Variables
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {/* Sidebar Navigation */}
                <div className="w-48 flex-shrink-0">
                  <nav className="space-y-1">
                    {[
                      { id: "global", label: "Global Variables", icon: "🌐" },
                      { id: "company", label: "Company Data", icon: "🏢" },
                      { id: "welcome", label: "Welcome Email", icon: "👋" },
                      { id: "subscription", label: "Subscription", icon: "💳" },
                      { id: "payment", label: "Payment", icon: "💰" },
                      { id: "usage_alert", label: "Usage Alert", icon: "⚠️" },
                      { id: "admin_notification", label: "Admin", icon: "🔔" },
                      { id: "newsletter", label: "Newsletter", icon: "📰" },
                      { id: "engagement", label: "Engagement", icon: "🎯" },
                      { id: "product_update", label: "Product Update", icon: "🚀" },
                      { id: "survey", label: "Survey", icon: "📊" },
                      { id: "sales", label: "Sales", icon: "🏷️" },
                      { id: "event", label: "Event", icon: "📅" },
                    ].map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedVariableGroup(group.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedVariableGroup === group.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="mr-2">{group.icon}</span>
                        {group.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  {variablesByGroup && variablesByGroup[selectedVariableGroup] && variablesByGroup[selectedVariableGroup].length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {variablesByGroup[selectedVariableGroup].map((variable: any) => (
                          <div key={variable._id}>
                            <Label className="text-sm font-medium text-muted-foreground">{`{${variable.key}}`}</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                value={editedVariables[variable.key] !== undefined ? editedVariables[variable.key] : variable.value}
                                onChange={(e) => {
                                  setEditedVariables(prev => ({ ...prev, [variable.key]: e.target.value }));
                                  setHasUnsavedChanges(true);
                                }}
                                placeholder={`Enter value for {${variable.key}}`}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (confirm(`Delete variable {${variable.key}}?`)) {
                                    try {
                                      await deleteVariable({ key: variable.key });
                                      toast.success("Variable deleted");
                                    } catch {
                                      toast.error("Failed to delete variable");
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditedVariables({});
                            setHasUnsavedChanges(false);
                          }}
                          disabled={!hasUnsavedChanges}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              for (const [key, value] of Object.entries(editedVariables)) {
                                const variable = variablesByGroup[selectedVariableGroup].find((v: any) => v.key === key);
                                if (variable) {
                                  await saveVariable({
                                    key,
                                    value,
                                    description: variable.description,
                                  });
                                }
                              }
                              setEditedVariables({});
                              setHasUnsavedChanges(false);
                              toast.success("Variables saved successfully");
                            } catch {
                              toast.error("Failed to save variables");
                            }
                          }}
                          disabled={!hasUnsavedChanges}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No variables in this category yet.</p>
                      <p className="text-sm mt-2">Click &quot;Auto Generate Variables&quot; to create default variables.</p>
                    </div>
                  )}

                  {/* Info Boxes */}
                  {selectedVariableGroup === "global" && (
                    <>
                      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Programmatic Variables (Auto-Generated)</h4>
                        <p className="text-sm text-blue-800 mb-2">These variables are automatically generated at runtime and cannot be edited:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <code className="px-2 py-1 bg-blue-100 rounded">{`{current_year}`}</code>
                          <code className="px-2 py-1 bg-blue-100 rounded">{`{event_date}`}</code>
                          <code className="px-2 py-1 bg-blue-100 rounded">{`{event_time}`}</code>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-semibold text-amber-900 mb-2">Dynamic Variables (From Database)</h4>
                        <p className="text-sm text-amber-800 mb-2">These variables are extracted from database records when emails are sent:</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <code className="px-2 py-1 bg-amber-100 rounded">{`{user_name}`}</code>
                          <code className="px-2 py-1 bg-amber-100 rounded">{`{invoiceNo}`}</code>
                          <code className="px-2 py-1 bg-amber-100 rounded">{`{credits_purchased}`}</code>
                          <code className="px-2 py-1 bg-amber-100 rounded">{`{notification_type}`}</code>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedVariableGroup === "company" && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🏢 Company Data Variables</h4>
                      <p className="text-sm text-green-800 mb-3">These variables are automatically populated from your company settings configured in <strong>Settings → Company</strong>:</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <code className="px-2 py-1 bg-green-100 rounded block mb-1">{`{company_name}`}</code>
                          <p className="text-xs text-green-700">Your company name</p>
                        </div>
                        <div>
                          <code className="px-2 py-1 bg-green-100 rounded block mb-1">{`{company_email}`}</code>
                          <p className="text-xs text-green-700">Main contact email</p>
                        </div>
                        <div>
                          <code className="px-2 py-1 bg-green-100 rounded block mb-1">{`{company_phone}`}</code>
                          <p className="text-xs text-green-700">Contact phone number</p>
                        </div>
                        <div>
                          <code className="px-2 py-1 bg-green-100 rounded block mb-1">{`{company_address}`}</code>
                          <p className="text-xs text-green-700">Full company address</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 mt-3">
                        💡 To update these values, go to <strong>Settings → Company</strong> and save your company information.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Log Preview Modal */}
      <Dialog open={showLogPreview} onOpenChange={setShowLogPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Sent to: {previewingLog?.sentTo} | {previewingLog?.createdAt && formatDate(previewingLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded">{previewingLog?.subject}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Template Type</Label>
              <div className="text-sm mt-1">
                <Badge variant="outline">{previewingLog?.templateType || "custom"}</Badge>
                {previewingLog?.templateName && <span className="ml-2 text-muted-foreground">({previewingLog.templateName})</span>}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Email Content</Label>
              <div className="border rounded-lg p-4 bg-white mt-2">
                <iframe
                  srcDoc={previewingLog?.htmlContent || ""}
                  className="w-full h-[500px] border-0"
                  title="Email Preview"
                />
              </div>
            </div>

            {previewingLog?.errorMessage && (
              <div>
                <Label className="text-sm font-medium text-red-600">Error Message</Label>
                <p className="text-sm mt-1 p-2 bg-red-50 text-red-800 rounded">{previewingLog.errorMessage}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Log Preview Code Modal */}
      <Dialog open={showLogCodePreview} onOpenChange={setShowLogCodePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email HTML Code</DialogTitle>
            <DialogDescription>
              Sent to: {previewingLog?.sentTo} | {previewingLog?.createdAt && formatDate(previewingLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <div className="text-sm mt-1 p-2 bg-muted rounded">{previewingLog?.subject}</div>
            </div>

            <div>
              <Label className="text-sm font-medium">Template Type</Label>
              <div className="text-sm mt-1">
                <Badge variant="outline">{previewingLog?.templateType || "custom"}</Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">HTML Code</Label>
              <div className="mt-2 p-4 bg-slate-950 text-green-400 rounded-lg text-sm font-mono overflow-x-auto max-h-[500px] overflow-y-auto">
                <pre>{previewingLog?.htmlContent || "No HTML content available"}</pre>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogCodePreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
            <DialogDescription>
              Modify the subject and HTML content of your email template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject Line</Label>
              <Input
                id="edit-subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-html">HTML Content</Label>
              <Textarea
                id="edit-html"
                value={editedHtml}
                onChange={(e) => setEditedHtml(e.target.value)}
                placeholder="HTML content..."
                rows={20}
                className="font-mono text-sm"
              />
            </div>
            
            {editingTemplate?.variables && (
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map((variable: string) => (
                    <code key={variable} className="px-2 py-1 bg-muted rounded text-xs">
                      {`{${variable}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Modal */}
      <Dialog open={!!previewingTemplate} onOpenChange={() => setPreviewingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewingTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewingTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-4 bg-white">
            <iframe
              srcDoc={previewingTemplate?.html || previewingTemplate?.htmlBody || ""}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewingTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => {
              setPreviewingTemplate(null);
              if (previewingTemplate) {
                handleEditTemplate(previewingTemplate);
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      {showTemplateEditor && (
        <TemplateEditorDialog
          template={selectedTemplate}
          onClose={() => { setShowTemplateEditor(false); setSelectedTemplate(null); }}
        />
      )}

      {/* Template Preview Dialog */}
      {showTemplatePreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Subject: {selectedTemplate.subject}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowTemplatePreview(false)}>
                  Close
                </Button>
              </div>
              <div 
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ 
                  __html: (selectedTemplate.htmlBody || selectedTemplate.html || "")
                    .replace(/\{\{user_name\}\}/g, "John Doe")
                    .replace(/\{\{company_name\}\}/g, "Acme Corp")
                    .replace(/\{\{amount\}\}/g, "$29.00")
                    .replace(/\{\{plan\}\}/g, "Pro")
                    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Creator Dialog */}
      {showCampaignCreator && (
        <CampaignCreatorDialog onClose={() => setShowCampaignCreator(false)} />
      )}
    </div>
  );
}

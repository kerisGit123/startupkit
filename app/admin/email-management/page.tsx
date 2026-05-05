"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Loader2, Mail, FileText, Send, Sparkles, Eye, Copy, Edit, Plus, Trash2, X, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TemplateEditorDialog } from "@/components/email/TemplateEditorDialog";
import { Badge } from "@/components/ui/badge";

export default function EmailManagementPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "settings";
  const [activeTab, setActiveTab] = useState(initialTab);
  const emailSettings = useQuery(api.platformConfig.getByCategory, { category: "email" });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const batchSet = useMutation(api.platformConfig.batchSet);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [testEmail, setTestEmail] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const sendTestEmail = useAction(api.emails.testEmail.sendTestEmail);

  // Templates
  const templates = useQuery(api.emails.templates.listTemplates);
  const deleteTemplate = useMutation(api.emails.templates.deleteTemplate);
  const duplicateTemplate = useMutation(api.emails.templates.duplicateTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Email logs
  const emailLogs = useQuery(api.emails.emailLogs.listEmailLogs);
  const deleteEmailLog = useMutation(api.emails.emailLogs.deleteEmailLog);
  const clearAllEmailLogs = useMutation(api.emails.emailLogs.clearAllEmailLogs);
  const emailLogsStats = useQuery(api.emails.emailLogs.getEmailLogsStats);
  const [previewingLog, setPreviewingLog] = useState<any>(null);
  const [showLogPreview, setShowLogPreview] = useState(false);
  const [showLogCodePreview, setShowLogCodePreview] = useState(false);

  // Send tab
  const allUsers = useQuery(api.adminUsers.getAllUsers);

  // Variables
  const variablesByGroup = useQuery(api.emails.variables.getVariablesByGroup);
  const saveVariable = useMutation(api.emails.variables.saveVariable);
  const deleteVariable = useMutation(api.emails.variables.deleteVariable);
  const generateDefaultVariables = useMutation(api.emails.variables.generateDefaultVariables);
  const [selectedVariableGroup, setSelectedVariableGroup] = useState("global");
  const [editedVariables, setEditedVariables] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [settings, setSettings] = useState({
    emailEnabled: false,
    useSystemNotification: false,
    emailFromName: "",
    emailFromAddress: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);

  if (emailSettings && !isInitialized) {
    setSettings({
      emailEnabled: (emailSettings.emailEnabled as boolean) ?? false,
      useSystemNotification: (emailSettings.useSystemNotification as boolean) ?? false,
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
          { key: "emailFromName", value: settings.emailFromName, category: "email", description: "Sender name", isEncrypted: false },
          { key: "emailFromAddress", value: settings.emailFromAddress, category: "email", description: "Sender email", isEncrypted: false },
        ],
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) { toast.error("Please enter a test email address"); return; }
    if (!settings.useSystemNotification && (!settings.emailFromName || !settings.emailFromAddress)) {
      toast.error("Configure sender settings first or enable Test Mode");
      return;
    }
    setTestEmailStatus("sending");
    try {
      const result = await sendTestEmail({
        to: testEmail,
        fromName: settings.emailFromName || "Test",
        fromEmail: settings.emailFromAddress || "test@example.com",
        useTestMode: settings.useSystemNotification,
      });
      if (result.success) {
        setTestEmailStatus("success");
        toast.success(settings.useSystemNotification ? "Test email logged to database (test mode)!" : "Test email sent!");
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

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Delete this template?")) {
      try {
        await deleteTemplate({ templateId: templateId as any });
        toast.success("Template deleted");
      } catch { toast.error("Failed to delete template"); }
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplate({ templateId: templateId as any });
      toast.success("Template duplicated");
    } catch { toast.error("Failed to duplicate template"); }
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (emailSettings === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Email Management</h1>
        </div>
        <p className="text-muted-foreground">Manage email settings, templates, and logs</p>
      </div>

      {saveStatus === "success" && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Settings saved successfully!</AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">Failed to save settings. Please try again.</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings" className="gap-2">
            <Mail className="h-4 w-4" />Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />Templates
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />Send
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />Email Logs
          </TabsTrigger>
          <TabsTrigger value="variables" className="gap-2">
            <Edit className="h-4 w-4" />Variables
          </TabsTrigger>
        </TabsList>

        {/* ── Settings Tab ── */}
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
                  <p className="text-sm text-muted-foreground">Master switch for all email sending</p>
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
              <CardTitle>Test Mode</CardTitle>
              <CardDescription>Log emails to database instead of sending — useful for development and template testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="useSystemNotification" className="text-base font-medium">Enable Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Emails are captured in Email Logs instead of being sent via SMTP</p>
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
              <CardTitle>Sender Configuration</CardTitle>
              <CardDescription>
                From name and address used when sending emails. SMTP credentials are in{" "}
                <a href="/admin/settings/email" className="text-blue-600 underline">Settings → Email (SMTP)</a>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  placeholder="Your Company"
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
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>Verify your SMTP configuration by sending a test email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Recipient Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleTestEmail} variant="outline" className="w-full gap-2" disabled={testEmailStatus === "sending"}>
                {testEmailStatus === "sending"
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                  : <><Send className="h-4 w-4" />Send Test Email</>}
              </Button>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saveStatus === "saving"} className="w-full" size="lg">
            {saveStatus === "saving"
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              : <><CheckCircle2 className="mr-2 h-4 w-4" />Save Settings</>}
          </Button>
        </TabsContent>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="space-y-6">
          <Tabs defaultValue="system" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="system">System Templates</TabsTrigger>
                <TabsTrigger value="custom">Custom Templates</TabsTrigger>
              </TabsList>
              <Button onClick={() => { setSelectedTemplate(null); setShowTemplateEditor(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            <TabsContent value="system" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.filter(t => t.category === "system").map((template) => (
                  <Card key={template._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs">{template.subject}</CardDescription>
                        </div>
                        <Badge variant="default" className="shrink-0">system</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.variables.map((variable: string) => (
                          <Badge key={variable} variant="outline" className="text-xs">{`{{${variable}}}`}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate(template); setShowTemplatePreview(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate(template); setShowTemplateEditor(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(template._id)}>
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
                  <p className="text-sm mt-2">Create a template to get started.</p>
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
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs">{template.subject}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{template.category || "custom"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.variables.map((variable: string) => (
                          <Badge key={variable} variant="outline" className="text-xs">{`{{${variable}}}`}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate(template); setShowTemplatePreview(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedTemplate(template); setShowTemplateEditor(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(template._id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template._id)}>
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
                  <p className="text-sm mt-2">Click &quot;Create Template&quot; to get started.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Send Tab ── */}
        <TabsContent value="send">
          <SendEmailTab templates={templates || []} allUsers={allUsers || []} />
        </TabsContent>

        {/* ── Email Logs Tab ── */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Logs</CardTitle>
                  <CardDescription>Captured emails when Test Mode is enabled</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Clear all email logs?")) {
                      try { await clearAllEmailLogs({}); toast.success("All email logs cleared"); }
                      catch { toast.error("Failed to clear logs"); }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailLogsStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{emailLogsStats.total}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Logged</div>
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
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                      <th className="p-3 text-left text-sm font-medium">Recipient</th>
                      <th className="p-3 text-left text-sm font-medium">Subject</th>
                      <th className="p-3 text-left text-sm font-medium">Template</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-right text-sm font-medium sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs && emailLogs.length > 0 ? emailLogs.map((log: any) => (
                      <tr key={log._id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{formatDate(log.createdAt)}</td>
                        <td className="p-3 text-sm font-medium">{log.sentTo}</td>
                        <td className="p-3 text-sm">{log.subject}</td>
                        <td className="p-3 text-sm"><Badge variant="outline">{log.templateType || "custom"}</Badge></td>
                        <td className="p-3 text-sm">
                          {log.status === "logged" && <Badge variant="secondary">Logged</Badge>}
                          {log.status === "sent" && <Badge variant="default">Sent</Badge>}
                          {log.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setPreviewingLog(log); setShowLogPreview(true); }}>
                              <Eye className="h-4 w-4 mr-1" />Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setPreviewingLog(log); setShowLogCodePreview(true); }}>
                              <FileText className="h-4 w-4 mr-1" />Code
                            </Button>
                            <Button size="sm" variant="destructive" onClick={async () => {
                              if (confirm("Delete this log?")) {
                                try { await deleteEmailLog({ logId: log._id }); toast.success("Log deleted"); }
                                catch { toast.error("Failed to delete log"); }
                              }
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No email logs yet. Enable Test Mode to capture emails here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Variables Tab ── */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Template Variables</CardTitle>
                  <CardDescription>Values injected into email templates at send time</CardDescription>
                </div>
                <Button onClick={async () => {
                  try {
                    const result = await generateDefaultVariables({});
                    toast.success(`Generated ${result.created} variables, skipped ${result.skipped} existing`);
                  } catch { toast.error("Failed to generate variables"); }
                }}>
                  <Sparkles className="h-4 w-4 mr-2" />Auto Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="w-48 shrink-0">
                  <nav className="space-y-1">
                    {[
                      { id: "global", label: "Global", icon: "🌐" },
                      { id: "company", label: "Company", icon: "🏢" },
                      { id: "welcome", label: "Welcome", icon: "👋" },
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
                          selectedVariableGroup === group.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span className="mr-2">{group.icon}</span>{group.label}
                      </button>
                    ))}
                  </nav>
                </div>

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
                              <Button variant="ghost" size="icon" onClick={async () => {
                                if (confirm(`Delete variable {${variable.key}}?`)) {
                                  try { await deleteVariable({ key: variable.key }); toast.success("Variable deleted"); }
                                  catch { toast.error("Failed to delete variable"); }
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setEditedVariables({}); setHasUnsavedChanges(false); }} disabled={!hasUnsavedChanges}>
                          Cancel
                        </Button>
                        <Button disabled={!hasUnsavedChanges} onClick={async () => {
                          try {
                            for (const [key, value] of Object.entries(editedVariables)) {
                              const variable = variablesByGroup[selectedVariableGroup].find((v: any) => v.key === key);
                              if (variable) await saveVariable({ key, value, description: variable.description });
                            }
                            setEditedVariables({});
                            setHasUnsavedChanges(false);
                            toast.success("Variables saved");
                          } catch { toast.error("Failed to save variables"); }
                        }}>
                          Save Changes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No variables in this category yet.</p>
                      <p className="text-sm mt-2">Click &quot;Auto Generate&quot; to create defaults.</p>
                    </div>
                  )}

                  {selectedVariableGroup === "global" && (
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Runtime Variables (auto-injected)</h4>
                      <p className="text-sm text-blue-800 mb-2">These are generated automatically at send time:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <code className="px-2 py-1 bg-blue-100 rounded">{`{current_year}`}</code>
                        <code className="px-2 py-1 bg-blue-100 rounded">{`{user_name}`}</code>
                        <code className="px-2 py-1 bg-blue-100 rounded">{`{invoiceNo}`}</code>
                      </div>
                    </div>
                  )}
                  {selectedVariableGroup === "company" && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Company variables</h4>
                      <p className="text-sm text-green-800">Pulled from <strong>Settings → Company</strong> at send time — edit them there, not here.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Log Preview */}
      <Dialog open={showLogPreview} onOpenChange={setShowLogPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              To: {previewingLog?.sentTo} · {previewingLog?.createdAt && formatDate(previewingLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded">{previewingLog?.subject}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1"><Badge variant="outline">{previewingLog?.templateType || "custom"}</Badge></div>
            </div>
            <div>
              <Label className="text-sm font-medium">Content</Label>
              <div className="border rounded-lg p-4 bg-white mt-2">
                <iframe srcDoc={previewingLog?.htmlContent || ""} className="w-full h-[500px] border-0" title="Email Preview" />
              </div>
            </div>
            {previewingLog?.errorMessage && (
              <div>
                <Label className="text-sm font-medium text-red-600">Error</Label>
                <p className="text-sm mt-1 p-2 bg-red-50 text-red-800 rounded">{previewingLog.errorMessage}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Log HTML Code */}
      <Dialog open={showLogCodePreview} onOpenChange={setShowLogCodePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email HTML</DialogTitle>
            <DialogDescription>
              To: {previewingLog?.sentTo} · {previewingLog?.createdAt && formatDate(previewingLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject</Label>
              <div className="text-sm mt-1 p-2 bg-muted rounded">{previewingLog?.subject}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">HTML</Label>
              <div className="mt-2 p-4 bg-slate-950 text-green-400 rounded-lg text-sm font-mono overflow-x-auto max-h-[500px] overflow-y-auto">
                <pre>{previewingLog?.htmlContent || "No HTML content"}</pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogCodePreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor */}
      {showTemplateEditor && (
        <TemplateEditorDialog
          template={selectedTemplate}
          onClose={() => { setShowTemplateEditor(false); setSelectedTemplate(null); }}
        />
      )}

      {/* Template Preview */}
      {showTemplatePreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Subject: {selectedTemplate.subject}</p>
                </div>
                <Button variant="ghost" onClick={() => setShowTemplatePreview(false)}>Close</Button>
              </div>
              <div
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{
                  __html: (selectedTemplate.htmlBody || selectedTemplate.html || "")
                    .replace(/\{\{user_name\}\}/g, "John Doe")
                    .replace(/\{\{company_name\}\}/g, "Acme Corp")
                    .replace(/\{\{amount\}\}/g, "$29.00")
                    .replace(/\{\{plan\}\}/g, "Pro")
                    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString()),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Send Email Tab ─────────────────────────────────────────────────────────

function SendEmailTab({ templates, allUsers }: { templates: any[]; allUsers: any[] }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recipients, setRecipients] = useState<{ email: string; name: string }[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const selectedTemplate = templates.find(t => t._id === selectedTemplateId);

  // When template changes, reset variables
  useEffect(() => {
    if (selectedTemplate?.variables) {
      const init: Record<string, string> = {};
      for (const v of selectedTemplate.variables) init[v] = "";
      setVariables(init);
    } else {
      setVariables({});
    }
    setPreviewHtml(null);
  }, [selectedTemplateId]);

  const renderHtml = (html: string) => {
    let out = html;
    for (const [k, v] of Object.entries(variables)) {
      out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{${k}}`);
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), v || `{${k}}`);
    }
    return out;
  };

  const addRecipient = (email: string, name = "") => {
    const trimmed = email.trim();
    if (!trimmed || recipients.find(r => r.email === trimmed)) return;
    setRecipients(prev => [...prev, { email: trimmed, name }]);
  };

  const removeRecipient = (email: string) =>
    setRecipients(prev => prev.filter(r => r.email !== email));

  const handleManualAdd = () => {
    addRecipient(manualEmail);
    setManualEmail("");
  };

  const filteredUsers = allUsers.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) ||
      (u.fullName || u.firstName || "").toLowerCase().includes(q);
  });

  const handleSend = async () => {
    if (!selectedTemplate) { toast.error("Select a template"); return; }
    if (recipients.length === 0) { toast.error("Add at least one recipient"); return; }

    const html = renderHtml(selectedTemplate.htmlBody || selectedTemplate.html || "");
    const subject = renderHtml(selectedTemplate.subject || "");

    setSending(true);
    let sent = 0;
    const errors: string[] = [];
    for (const recipient of recipients) {
      const personalHtml = html.replace(/\{\{user_name\}\}/g, recipient.name || recipient.email)
                               .replace(/\{user_name\}/g, recipient.name || recipient.email);
      try {
        const res = await fetch("/api/send-system-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: recipient.email, subject, html: personalHtml }),
        });
        const data = await res.json();
        if (data.success) {
          sent++;
        } else {
          errors.push(`${recipient.email}: ${data.error || "unknown error"}`);
        }
      } catch (e) {
        errors.push(`${recipient.email}: network error`);
      }
    }
    setSending(false);
    if (errors.length === 0) {
      toast.success(`Sent to ${sent} recipient${sent !== 1 ? "s" : ""}`);
    } else if (sent > 0) {
      toast.warning(`Sent: ${sent}, Failed: ${errors.length}`);
      errors.forEach(e => toast.error(e, { duration: 8000 }));
    } else {
      toast.error(errors[0] || "Failed to send");
      if (errors.length > 1) errors.slice(1).forEach(e => toast.error(e, { duration: 8000 }));
    }
  };

  return (
    <div className="mt-4 grid lg:grid-cols-2 gap-6">
      {/* Left: compose */}
      <div className="space-y-5">
        {/* Template picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Select Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template…" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t._id} value={t._id}>
                    <span className="flex items-center gap-2">
                      {t.name}
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground mt-2">
                Subject: <span className="font-medium">{selectedTemplate.subject}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Recipients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleManualAdd(); } }}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleManualAdd} disabled={!manualEmail.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setShowUserPicker(v => !v)}>
                <Users className="w-4 h-4 mr-1" />
                Users
              </Button>
            </div>

            {/* User picker */}
            {showUserPicker && (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search users…" value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                </div>
                {filteredUsers.slice(0, 50).map(u => (
                  <div key={u._id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium">{u.fullName || u.firstName || u.email}</span>
                      <span className="text-muted-foreground text-xs ml-2">{u.email}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                      onClick={() => addRecipient(u.email, u.fullName || u.firstName || "")}>
                      Add
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No users found</p>}
              </div>
            )}

            {/* Recipient list */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {recipients.map(r => (
                  <span key={r.email} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {r.name ? `${r.name} <${r.email}>` : r.email}
                    <button onClick={() => removeRecipient(r.email)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variables */}
        {selectedTemplate && selectedTemplate.variables?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Fill Variables</CardTitle>
              <CardDescription>These will be substituted into the template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedTemplate.variables.map((v: string) => (
                <div key={v} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{`{{${v}}}`}</Label>
                  <Input
                    placeholder={`Value for ${v}`}
                    value={variables[v] || ""}
                    onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!selectedTemplate}
              onClick={() => setPreviewHtml(renderHtml(selectedTemplate?.htmlBody || selectedTemplate?.html || ""))}
            >
              <Eye className="w-4 h-4 mr-2" />Preview
            </Button>
            <Button
              className="flex-1"
              disabled={sending || !selectedTemplate || recipients.length === 0}
              onClick={handleSend}
            >
              {sending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                : <><Send className="w-4 h-4 mr-2" />Send{recipients.length > 0 ? ` to ${recipients.length}` : ""}</>}
            </Button>
          </div>
          {(!selectedTemplate || recipients.length === 0) && (
            <p className="text-xs text-muted-foreground text-center">
              {!selectedTemplate && recipients.length === 0
                ? "Select a template and add recipients to send"
                : !selectedTemplate
                  ? "Select a template first"
                  : "Add at least one recipient"}
            </p>
          )}
        </div>
      </div>

      {/* Right: preview */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            {selectedTemplate && <CardDescription>Subject: {renderHtml(selectedTemplate.subject || "")}</CardDescription>}
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border rounded-lg"
                title="Email preview"
              />
            ) : (
              <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/30 text-muted-foreground text-sm">
                {selectedTemplate ? "Click Preview to render the email" : "Select a template to get started"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

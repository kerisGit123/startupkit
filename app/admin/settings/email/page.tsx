"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Send, Settings, Shield, Zap, Loader2, AlertCircle, Eye, EyeOff, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailSettingsPage() {
  const emailSettings = useQuery(api.emailSettings.getSettings);
  const updateEmailSettings = useMutation(api.emailSettings.updateSettings);
  const smtpConfig = useQuery(api.smtpConfig.getSmtpConfig);
  const updateSmtpConfig = useMutation(api.smtpConfig.updateSmtpConfig);

  const [smtpLoaded, setSmtpLoaded] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    useTLS: true,
    apiKey: "",
    active: false,
  });
  const [testEmailTo, setTestEmailTo] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingSMTP, setIsSavingSMTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Populate SMTP fields once when config loads
  if (smtpConfig && !smtpLoaded) {
    setSmtpLoaded(true);
    setSmtpSettings({
      host: smtpConfig.smtpHost || "",
      port: smtpConfig.smtpPort || "587",
      username: smtpConfig.smtpUsername || "",
      password: smtpConfig.smtpPassword || "",
      fromEmail: smtpConfig.smtpFromEmail || "",
      fromName: smtpConfig.smtpFromName || "",
      useTLS: smtpConfig.smtpUseTLS ?? true,
      apiKey: smtpConfig.smtpApiKey || "",
      active: smtpConfig.smtpActive ?? false,
    });
  }

  const [automationSettings, setAutomationSettings] = useState({
    welcomeEmail: emailSettings?.welcomeEmailEnabled ?? true,
    invoiceNotification: emailSettings?.subscriptionEmailEnabled ?? true,
    paymentConfirmation: emailSettings?.paymentNotificationEnabled ?? true,
    paymentReminder: false,
    overdueNotice: false,
  });

  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubject: "Welcome to our platform!",
    welcomeBody: "Hi {{name}},\n\nWelcome to our platform...",
    invoiceSubject: "Your Invoice #{{invoiceNumber}}",
    invoiceBody: "Dear {{customerName}},\n\nPlease find your invoice attached...",
  });

  const handleSaveSMTP = async () => {
    setIsSavingSMTP(true);
    try {
      await updateSmtpConfig({
        smtpHost: smtpSettings.host,
        smtpPort: smtpSettings.port,
        smtpUsername: smtpSettings.username,
        smtpPassword: smtpSettings.password,
        smtpFromEmail: smtpSettings.fromEmail,
        smtpFromName: smtpSettings.fromName,
        smtpUseTLS: smtpSettings.useTLS,
        smtpApiKey: smtpSettings.apiKey,
        smtpActive: smtpSettings.active,
      });
      await updateEmailSettings({
        senderEmail: smtpSettings.fromEmail,
        senderName: smtpSettings.fromName,
        emailEnabled: true,
      });
      toast.success("SMTP settings saved successfully");
    } catch {
      toast.error("Failed to save SMTP settings");
    } finally {
      setIsSavingSMTP(false);
    }
  };

  const handleSaveAutomation = async () => {
    try {
      await updateEmailSettings({
        welcomeEmailEnabled: automationSettings.welcomeEmail,
        subscriptionEmailEnabled: automationSettings.invoiceNotification,
        paymentNotificationEnabled: automationSettings.paymentConfirmation,
      });
      toast.success("Automation settings saved successfully");
    } catch {
      toast.error("Failed to save automation settings");
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) {
      toast.error("Please enter a recipient email address");
      return;
    }
    if (!smtpSettings.host || !smtpSettings.username) {
      toast.error("Please save your SMTP settings first");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/smtp/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailTo,
          smtpHost: smtpSettings.host,
          smtpPort: smtpSettings.port,
          smtpUsername: smtpSettings.username,
          smtpPassword: smtpSettings.password,
          smtpFromEmail: smtpSettings.fromEmail,
          smtpFromName: smtpSettings.fromName,
          smtpUseTLS: smtpSettings.useTLS,
          apiKey: smtpSettings.apiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test email");
      toast.success("Test email sent successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send test email";
      toast.error(message);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure email delivery and templates
        </p>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp" className="gap-2">
            <Settings className="w-4 h-4" />
            SMTP Configuration
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="w-4 h-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* SMTP Configuration */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMTP Server Settings</CardTitle>
                  <CardDescription>
                    Configure your SMTP server for sending emails
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${smtpSettings.active ? "text-green-600" : "text-muted-foreground"}`}>
                    {smtpSettings.active ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={smtpSettings.active}
                    onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, active: checked })}
                  />
                </div>
              </div>
              {!smtpSettings.active && (
                <Alert className="mt-3 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    SMTP is inactive. Emails will be logged to the database only (not actually sent).
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    placeholder="587"
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    placeholder="your-email@example.com"
                    value={smtpSettings.username}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={smtpSettings.password}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(smtpSettings.password); toast.success("Password copied"); }} disabled={!smtpSettings.password}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    placeholder="noreply@yourcompany.com"
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Your Company"
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-apikey">API Key <span className="text-xs text-muted-foreground">(optional, for Brevo/Sendinblue HTTP API)</span></Label>
                <div className="relative">
                  <Input
                    id="smtp-apikey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="xkeysib-..."
                    value={smtpSettings.apiKey}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, apiKey: e.target.value })}
                    className="pr-20"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(smtpSettings.apiKey); toast.success("API key copied"); }} disabled={!smtpSettings.apiKey}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">If provided and using Brevo, emails will be sent via HTTP API instead of SMTP. Get your API key from Brevo → Settings → SMTP & API → API Keys.</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="use-tls"
                  checked={smtpSettings.useTLS}
                  onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, useTLS: checked })}
                />
                <Label htmlFor="use-tls">Use TLS/SSL encryption</Label>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <div className="flex gap-2">
                  <Button onClick={handleSaveSMTP} disabled={isSavingSMTP}>
                    {isSavingSMTP ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save SMTP Settings"}
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <Label htmlFor="test-email-to" className="text-sm font-medium">Send Test Email</Label>
                  <p className="text-xs text-muted-foreground mb-2">Verify your SMTP configuration by sending a test email</p>
                  <div className="flex gap-2">
                    <Input
                      id="test-email-to"
                      type="email"
                      placeholder="recipient@example.com"
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button variant="outline" onClick={handleTestEmail} disabled={isSendingTest} className="gap-2">
                      {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSendingTest ? "Sending..." : "Send Test Email"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use app-specific passwords for Gmail/Google Workspace</p>
              <p>• Enable 2FA on your email account</p>
              <p>• Store credentials securely using environment variables</p>
              <p>• Regularly rotate your SMTP passwords</p>
              <p>• Monitor email sending limits to avoid being blocked</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Email</CardTitle>
              <CardDescription>
                Sent to new customers when they sign up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-subject">Subject Line</Label>
                <Input
                  id="welcome-subject"
                  value={emailTemplates.welcomeSubject}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-body">Email Body</Label>
                <Textarea
                  id="welcome-body"
                  rows={6}
                  value={emailTemplates.welcomeBody}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeBody: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{"}{"{"} name {"}"}{"}"}, {"{"}{"{"} email {"}"}{"}"}, {"{"}{"{"} company {"}"}{"}"} 
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Email</CardTitle>
              <CardDescription>
                Sent when a new invoice is created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-subject">Subject Line</Label>
                <Input
                  id="invoice-subject"
                  value={emailTemplates.invoiceSubject}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, invoiceSubject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-body">Email Body</Label>
                <Textarea
                  id="invoice-body"
                  rows={6}
                  value={emailTemplates.invoiceBody}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, invoiceBody: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{"}{"{"} customerName {"}"}{"}"}, {"{"}{"{"} invoiceNumber {"}"}{"}"}, {"{"}{"{"} amount {"}"}{"}"}, {"{"}{"{"} dueDate {"}"}{"}"} 
                </p>
              </div>
            </CardContent>
          </Card>

          <Button>Save Email Templates</Button>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Emails</CardTitle>
              <CardDescription>
                Configure which emails are sent automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Welcome Email</p>
                  <p className="text-sm text-muted-foreground">Send when new customer signs up</p>
                </div>
                <Switch 
                  checked={automationSettings.welcomeEmail}
                  onCheckedChange={(checked) => setAutomationSettings({...automationSettings, welcomeEmail: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice Notification</p>
                  <p className="text-sm text-muted-foreground">Send when invoice is created</p>
                </div>
                <Switch 
                  checked={automationSettings.invoiceNotification}
                  onCheckedChange={(checked) => setAutomationSettings({...automationSettings, invoiceNotification: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Confirmation</p>
                  <p className="text-sm text-muted-foreground">Send when payment is received</p>
                </div>
                <Switch 
                  checked={automationSettings.paymentConfirmation}
                  onCheckedChange={(checked) => setAutomationSettings({...automationSettings, paymentConfirmation: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminder</p>
                  <p className="text-sm text-muted-foreground">Send 3 days before due date</p>
                </div>
                <Switch 
                  checked={automationSettings.paymentReminder}
                  onCheckedChange={(checked) => setAutomationSettings({...automationSettings, paymentReminder: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Overdue Notice</p>
                  <p className="text-sm text-muted-foreground">Send when invoice is overdue</p>
                </div>
                <Switch 
                  checked={automationSettings.overdueNotice}
                  onCheckedChange={(checked) => setAutomationSettings({...automationSettings, overdueNotice: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveAutomation}>Save Automation Settings</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

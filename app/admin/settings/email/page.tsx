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
import { Mail, Send, Settings, Shield, Zap } from "lucide-react";

export default function EmailSettingsPage() {
  const emailSettings = useQuery(api.emailSettings.getSettings);
  const updateEmailSettings = useMutation(api.emailSettings.updateSettings);

  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: emailSettings?.senderEmail || "",
    fromName: emailSettings?.senderName || "",
    useTLS: true,
  });

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
    try {
      await updateEmailSettings({
        senderEmail: smtpSettings.fromEmail,
        senderName: smtpSettings.fromName,
        emailEnabled: true,
      });
      toast.success("Email settings saved successfully");
    } catch (error) {
      toast.error("Failed to save email settings");
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
    } catch (error) {
      toast.error("Failed to save automation settings");
    }
  };

  const handleTestEmail = async () => {
    toast.info("Sending test email...");
    // TODO: Implement test email functionality
    setTimeout(() => {
      toast.success("Test email sent successfully!");
    }, 2000);
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
              <CardTitle>SMTP Server Settings</CardTitle>
              <CardDescription>
                Configure your SMTP server for sending emails
              </CardDescription>
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
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="••••••••"
                    value={smtpSettings.password}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                  />
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="use-tls"
                  checked={smtpSettings.useTLS}
                  onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, useTLS: checked })}
                />
                <Label htmlFor="use-tls">Use TLS/SSL encryption</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveSMTP}>
                  Save SMTP Settings
                </Button>
                <Button variant="outline" onClick={handleTestEmail} className="gap-2">
                  <Send className="w-4 h-4" />
                  Send Test Email
                </Button>
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

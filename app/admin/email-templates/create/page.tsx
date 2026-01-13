"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVAILABLE_VARIABLES = [
  "username",
  "email",
  "link",
  "credits",
  "date",
  "company_name",
  "amount",
  "plan",
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const createTemplate = useMutation(api.emailTemplates.createTemplate);

  const [name, setName] = useState("");
  const [type, setType] = useState<"welcome" | "password_reset" | "subscription" | "payment" | "usage_alert" | "admin_notification" | "custom">("welcome");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [plainTextBody, setPlainTextBody] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const insertVariable = (variable: string, field: "subject" | "html" | "plain") => {
    const variableText = `{{${variable}}}`;
    if (field === "subject") {
      setSubject(subject + variableText);
    } else if (field === "html") {
      setHtmlBody(htmlBody + variableText);
    } else {
      setPlainTextBody(plainTextBody + variableText);
    }
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables([...selectedVariables, variable]);
    }
  };

  const handleSave = async () => {
    if (!name || !subject || !htmlBody) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      await createTemplate({
        name,
        type,
        subject,
        htmlBody,
        plainTextBody,
        variables: selectedVariables,
        isActive,
        isDefault,
      });
      router.push("/admin/email-templates");
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template");
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/email-templates">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Email Template</h1>
        <p className="text-muted-foreground mt-2">
          Create a new email template with customizable variables
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="type">Template Type *</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="usage_alert">Usage Alert</SelectItem>
                  <SelectItem value="admin_notification">Admin Notification</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this template for use
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDefault">Set as Default</Label>
                <p className="text-sm text-muted-foreground">
                  Use this as the default template for this type
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Email Subject *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to {{company_name}}, {{username}}!"
            />
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable, "subject")}
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* HTML Body */}
        <Card>
          <CardHeader>
            <CardTitle>HTML Email Body *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder="Enter HTML email content..."
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable, "html")}
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plain Text */}
        <Card>
          <CardHeader>
            <CardTitle>Plain Text Version (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={plainTextBody}
              onChange={(e) => setPlainTextBody(e.target.value)}
              placeholder="Enter plain text version..."
              rows={10}
            />
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((variable) => (
                <Button
                  key={variable}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable, "plain")}
                >
                  {`{{${variable}}}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/email-templates">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}

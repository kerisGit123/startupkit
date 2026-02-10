"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ChatbotSettingsPage() {
  const frontendConfig = useQuery(api.chatbot.getConfig, { type: "frontend" });
  const userPanelConfig = useQuery(api.chatbot.getConfig, { type: "user_panel" });
  const updateConfig = useMutation(api.chatbot.updateConfig);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chatbot Configuration</h1>
        <p className="text-gray-500 mt-1">Configure your AI chatbots and webhook integration</p>
      </div>
      
      <Tabs defaultValue="frontend">
        <TabsList>
          <TabsTrigger value="frontend">Frontend Chatbot</TabsTrigger>
          <TabsTrigger value="user_panel">User Panel Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="frontend">
          <ChatbotConfigCard 
            config={frontendConfig}
            type="frontend"
            onUpdate={updateConfig}
          />
        </TabsContent>

        <TabsContent value="user_panel">
          <ChatbotConfigCard 
            config={userPanelConfig}
            type="user_panel"
            onUpdate={updateConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ChatbotConfigCardProps {
  config: any;
  type: "frontend" | "user_panel";
  onUpdate: any;
}

function ChatbotConfigCard({ config, type, onUpdate }: ChatbotConfigCardProps) {
  const [isActive, setIsActive] = useState(config?.isActive || false);
  const [webhookUrl, setWebhookUrl] = useState(config?.n8nWebhookUrl || "");
  const [widgetColor, setWidgetColor] = useState(config?.primaryColor || "#854fff");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when config loads from Convex (async query)
  useEffect(() => {
    if (config) {
      setIsActive(config.isActive || false);
      setWebhookUrl(config.n8nWebhookUrl || "");
      setWidgetColor(config.primaryColor || "#854fff");
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({
        type,
        isActive,
        n8nWebhookUrl: webhookUrl,
        primaryColor: widgetColor,
        secondaryColor: "#6b3fd4",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        userMessageBgColor: widgetColor,
        aiMessageBgColor: "#f1f1f1",
        userMessageTextColor: "#ffffff",
        aiMessageTextColor: "#333333",
        aiBorderColor: "#e0e0e0",
        aiTextColor: "#333333",
        welcomeMessage: config?.welcomeMessage || "Hi 👋, how can we help?",
        responseTimeText: config?.responseTimeText || "We typically respond right away",
        firstBotMessage: config?.firstBotMessage || "Hi there! How can we help today?",
        placeholderText: config?.placeholderText || "Type your message here...",
        position: config?.position || "right",
        theme: config?.theme || "light",
        roundness: config?.roundness || 12,
        companyName: config?.companyName || "Your Company",
        showThemeToggle: config?.showThemeToggle || false,
        showCompanyLogo: config?.showCompanyLogo || true,
        showResponseTime: config?.showResponseTime || true,
        enableSoundNotifications: config?.enableSoundNotifications || false,
        enableTypingIndicator: config?.enableTypingIndicator || true,
        mobileFullScreen: config?.mobileFullScreen || false,
        mobilePosition: config?.mobilePosition || "bottom",
      });
      toast.success("Configuration saved successfully!");
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL first");
      return;
    }

    try {
      // Use the API route instead of calling webhook directly to avoid CORS
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n8nWebhookUrl: webhookUrl,
          chatId: "test_" + Date.now(),
          message: "Test connection from chatbot settings",
          route: type,
          userId: null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.output) {
          toast.success("Connection successful! Response: " + data.output.substring(0, 100));
        } else if (data.error) {
          toast.error("Connection failed: " + data.error);
        } else {
          toast.success("Connection successful!");
        }
      } else {
        toast.error("Connection failed: " + response.statusText);
      }
    } catch (error: any) {
      toast.error("Connection failed: " + error.message);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>
          {type === "frontend" ? "Frontend" : "User Panel"} Chatbot Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activation Switch */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Chatbot</Label>
            <p className="text-sm text-gray-500">Activate this chatbot on your website</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* Webhook URL */}
        <div>
          <Label>Webhook URL</Label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-instance.com/webhook/..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Create a webhook trigger in your automation tool and paste the URL here
          </p>
        </div>

        {/* Widget Color */}
        <div>
          <Label>Widget Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              className="w-20"
            />
            <Input
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              placeholder="#854fff"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This color will be used for the chat widget button and messages
          </p>
        </div>

        {/* Test Connection */}
        <Button variant="outline" onClick={testWebhook} className="w-full">
          Test Connection
        </Button>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
}

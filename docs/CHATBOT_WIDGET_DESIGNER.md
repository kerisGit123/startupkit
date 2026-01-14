# 🎨 Chat Widget Designer - Visual Customization System

**Complete implementation guide for the visual widget designer with live preview and mobile optimization**

---

## 📋 Overview

The **Chat Widget Designer** is a visual customization tool in the super admin panel that allows administrators to design and customize the chat widget appearance in real-time without writing code. It includes:

- **Visual Editor** - Drag-and-drop customization interface
- **Live Preview** - See changes in real-time (desktop + mobile)
- **Theme Support** - Light, dark, and auto themes
- **Mobile Optimization** - Responsive design with mobile-specific settings
- **Brand Customization** - Colors, logos, messages, and positioning
- **Export/Import** - Save and share widget configurations

---

## 🎯 Features

### Design Customization
- **Theme Selection** - Light, Dark, Auto (system preference)
- **Position** - Left or Right corner placement
- **Roundness** - Border radius slider (0-24px)
- **Colors** - Primary, secondary, background, text, message bubbles
- **Branding** - Company name, logo upload
- **Messages** - Welcome message, response time text, first bot message

### Live Preview
- **Desktop Preview** - Full-size widget preview
- **Mobile Preview** - Mobile-optimized view
- **Real-time Updates** - Instant visual feedback
- **Interactive Demo** - Test widget functionality

### Mobile Optimization
- **Full Screen Mode** - Option for full-screen chat on mobile
- **Position Control** - Bottom or top placement on mobile
- **Responsive Design** - Auto-adjusts for screen sizes
- **Touch-Optimized** - Larger touch targets for mobile

---

## 🗄️ Enhanced Database Schema

Already added to `chatbot_config` table in main CHATBOT.md:

```typescript
chatbot_config: defineTable({
  type: v.union(v.literal("frontend"), v.literal("user_panel")),
  isActive: v.boolean(),
  n8nWebhookUrl: v.string(),
  
  // Widget Designer Settings
  theme: v.union(v.literal("light"), v.literal("dark"), v.literal("auto")),
  position: v.union(v.literal("left"), v.literal("right")),
  roundness: v.number(), // 0-24px
  
  // Branding
  companyName: v.string(),
  companyLogoUrl: v.optional(v.string()),
  logoStorageId: v.optional(v.string()),
  
  // Colors
  primaryColor: v.string(),
  secondaryColor: v.string(),
  backgroundColor: v.string(),
  textColor: v.string(),
  userMessageBgColor: v.string(),
  aiMessageBgColor: v.string(),
  userMessageTextColor: v.string(),
  aiMessageTextColor: v.string(),
  aiBorderColor: v.string(),
  aiTextColor: v.string(),
  
  // Dark Theme Colors
  darkPrimaryColor: v.optional(v.string()),
  darkSecondaryColor: v.optional(v.string()),
  darkBackgroundColor: v.optional(v.string()),
  darkTextColor: v.optional(v.string()),
  
  // Messages
  welcomeMessage: v.string(),
  responseTimeText: v.string(),
  firstBotMessage: v.string(),
  placeholderText: v.string(),
  
  // Features
  showThemeToggle: v.boolean(),
  showCompanyLogo: v.boolean(),
  showResponseTime: v.boolean(),
  enableSoundNotifications: v.boolean(),
  enableTypingIndicator: v.boolean(),
  
  // Mobile Settings
  mobileFullScreen: v.boolean(),
  mobilePosition: v.union(v.literal("bottom"), v.literal("top")),
  
  updatedAt: v.number(),
  updatedBy: v.string(),
}).index("by_type", ["type"]),
```

---

## 🎨 Widget Designer Component

### Main Designer Page (`/admin/widget-designer`)

```typescript
// app/admin/widget-designer/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetCustomizer } from "@/components/widget-designer/WidgetCustomizer";
import { WidgetPreview } from "@/components/widget-designer/WidgetPreview";
import { MobilePreview } from "@/components/widget-designer/MobilePreview";

export default function WidgetDesignerPage() {
  const [selectedType, setSelectedType] = useState<"frontend" | "user_panel">("frontend");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  
  const config = useQuery(api.chatbot.getConfig, { type: selectedType });
  const updateConfig = useMutation(api.chatbot.updateConfig);
  
  const [localConfig, setLocalConfig] = useState(config);
  
  // Update local config when database config changes
  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);
  
  const handleConfigChange = (updates: Partial<typeof config>) => {
    setLocalConfig({ ...localConfig, ...updates });
  };
  
  const handleSave = async () => {
    await updateConfig(localConfig);
    toast.success("Widget design saved successfully!");
  };
  
  const handleReset = () => {
    setLocalConfig(config);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Design Your Widget</h1>
          <p className="text-sm text-gray-500">Start customizing your chat widget in real-time</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset Changes
          </Button>
          <Button onClick={handleSave}>
            Save Design
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Customization Options */}
        <div className="w-96 bg-white border-r overflow-y-auto">
          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="frontend" className="flex-1">
                Frontend Widget
              </TabsTrigger>
              <TabsTrigger value="user_panel" className="flex-1">
                User Panel Widget
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <WidgetCustomizer
            config={localConfig}
            onChange={handleConfigChange}
          />
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <div className="flex gap-2">
              <Button
                variant={previewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Desktop
              </Button>
              <Button
                variant={previewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            See your widget design in real-time
          </p>
          
          {previewMode === "desktop" ? (
            <WidgetPreview config={localConfig} />
          ) : (
            <MobilePreview config={localConfig} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎛️ Widget Customizer Component

```typescript
// components/widget-designer/WidgetCustomizer.tsx
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WidgetCustomizerProps {
  config: any;
  onChange: (updates: any) => void;
}

export function WidgetCustomizer({ config, onChange }: WidgetCustomizerProps) {
  const [activeTab, setActiveTab] = useState("customize");

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="customize" className="flex-1">
            1. Customize
          </TabsTrigger>
          <TabsTrigger value="connect" className="flex-1">
            2. Connect
          </TabsTrigger>
          <TabsTrigger value="download" className="flex-1">
            3. Download
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Customize */}
        <TabsContent value="customize" className="space-y-6 mt-4">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">THEME</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={config?.theme || "light"}
                onValueChange={(value) => onChange({ theme: value })}
              >
                <div className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">☀️ Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">🌙 Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">🔄 Auto</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Position */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">POSITION</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={config?.position || "right"}
                onValueChange={(value) => onChange({ position: value })}
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left" id="left" />
                    <Label htmlFor="left">← Left</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="right" />
                    <Label htmlFor="right">Right →</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Roundness */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ROUNDNESS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Slider
                  value={[config?.roundness || 12]}
                  onValueChange={([value]) => onChange({ roundness: value })}
                  max={24}
                  step={1}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0px</span>
                  <span>{config?.roundness || 12}px</span>
                  <span>24px</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={config?.companyName || ""}
                  onChange={(e) => onChange({ companyName: e.target.value })}
                  placeholder="Your Company"
                />
              </div>
              
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={config?.companyLogoUrl || ""}
                  onChange={(e) => onChange({ companyLogoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">Or upload a logo file</p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🎨 Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">PRIMARY</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.primaryColor || "#854fff"}
                      onChange={(e) => onChange({ primaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={config?.primaryColor || "#854fff"}
                      onChange={(e) => onChange({ primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">SECONDARY</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.secondaryColor || "#6b3fd4"}
                      onChange={(e) => onChange({ secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={config?.secondaryColor || "#6b3fd4"}
                      onChange={(e) => onChange({ secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs">BACKGROUND</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={config?.backgroundColor || "#ffffff"}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={config?.backgroundColor || "#ffffff"}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">TEXT</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={config?.textColor || "#333333"}
                    onChange={(e) => onChange({ textColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={config?.textColor || "#333333"}
                    onChange={(e) => onChange({ textColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-xs font-semibold">Message Bubbles</Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">USER TEXT</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.userMessageTextColor || "#ffffff"}
                      onChange={(e) => onChange({ userMessageTextColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">AI BACKGROUND</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.aiMessageBgColor || "#f1f1f1"}
                      onChange={(e) => onChange({ aiMessageBgColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">AI BORDER</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.aiBorderColor || "#e0e0e0"}
                      onChange={(e) => onChange({ aiBorderColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs">AI TEXT</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={config?.aiTextColor || "#333333"}
                      onChange={(e) => onChange({ aiTextColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dark Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🌙 Dark Theme Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                Optional: Customize colors for dark mode
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">PRIMARY</Label>
                  <Input
                    type="color"
                    value={config?.darkPrimaryColor || "#9b6fff"}
                    onChange={(e) => onChange({ darkPrimaryColor: e.target.value })}
                    className="w-full h-10 p-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">BACKGROUND</Label>
                  <Input
                    type="color"
                    value={config?.darkBackgroundColor || "#1a1a1a"}
                    onChange={(e) => onChange({ darkBackgroundColor: e.target.value })}
                    className="w-full h-10 p-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Welcome Message</Label>
                <Input
                  value={config?.welcomeMessage || ""}
                  onChange={(e) => onChange({ welcomeMessage: e.target.value })}
                  placeholder="Hi 👋, how can we help?"
                />
              </div>
              
              <div>
                <Label>Response Time Text</Label>
                <Input
                  value={config?.responseTimeText || ""}
                  onChange={(e) => onChange({ responseTimeText: e.target.value })}
                  placeholder="We typically respond right away"
                />
              </div>
              
              <div>
                <Label>First Bot Message</Label>
                <Textarea
                  value={config?.firstBotMessage || ""}
                  onChange={(e) => onChange({ firstBotMessage: e.target.value })}
                  placeholder="Hi there! How can we help today?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">✨ Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Show Theme Toggle</Label>
                <Switch
                  checked={config?.showThemeToggle || false}
                  onCheckedChange={(checked) => onChange({ showThemeToggle: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Show Company Logo</Label>
                <Switch
                  checked={config?.showCompanyLogo || false}
                  onCheckedChange={(checked) => onChange({ showCompanyLogo: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Show Response Time</Label>
                <Switch
                  checked={config?.showResponseTime || false}
                  onCheckedChange={(checked) => onChange({ showResponseTime: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Sound Notifications</Label>
                <Switch
                  checked={config?.enableSoundNotifications || false}
                  onCheckedChange={(checked) => onChange({ enableSoundNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Typing Indicator</Label>
                <Switch
                  checked={config?.enableTypingIndicator || true}
                  onCheckedChange={(checked) => onChange({ enableTypingIndicator: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📱 Mobile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Full Screen on Mobile</Label>
                <Switch
                  checked={config?.mobileFullScreen || false}
                  onCheckedChange={(checked) => onChange({ mobileFullScreen: checked })}
                />
              </div>
              
              <div>
                <Label>Mobile Position</Label>
                <RadioGroup
                  value={config?.mobilePosition || "bottom"}
                  onValueChange={(value) => onChange({ mobilePosition: value })}
                >
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bottom" id="mobile-bottom" />
                      <Label htmlFor="mobile-bottom">Bottom</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="top" id="mobile-top" />
                      <Label htmlFor="mobile-top">Top</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Connect */}
        <TabsContent value="connect" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">n8n Webhook URL</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={config?.n8nWebhookUrl || ""}
                onChange={(e) => onChange({ n8nWebhookUrl: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Create a webhook trigger in n8n and paste the URL here
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Send Test Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Download */}
        <TabsContent value="download" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export Widget Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Copy the widget code to embed on your website
              </p>
              
              <Button variant="outline" className="w-full">
                📋 Copy Widget Code
              </Button>
              
              <Button variant="outline" className="w-full">
                💾 Download as HTML
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 👁️ Live Preview Components

### Desktop Preview

```typescript
// components/widget-designer/WidgetPreview.tsx
"use client";

import { useState } from "react";

interface WidgetPreviewProps {
  config: any;
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: config?.firstBotMessage || "Hi there! How can we help today?",
      timestamp: Date.now(),
    },
  ]);

  const borderRadius = `${config?.roundness || 12}px`;
  const position = config?.position || "right";

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-inner p-8">
      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
        <p className="text-sm">Your website preview</p>
      </div>

      {/* Chat Widget */}
      <div
        className={`absolute ${position === "right" ? "right-8" : "left-8"} bottom-8`}
        style={{ zIndex: 1000 }}
      >
        {/* Chat Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            style={{
              backgroundColor: config?.primaryColor || "#854fff",
              borderRadius: borderRadius,
            }}
          >
            <span className="text-2xl">💬</span>
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div
            className="w-[350px] h-[500px] flex flex-col shadow-2xl overflow-hidden"
            style={{
              backgroundColor: config?.backgroundColor || "#ffffff",
              borderRadius: borderRadius,
            }}
          >
            {/* Header */}
            <div
              className="p-4 text-white flex justify-between items-center"
              style={{ backgroundColor: config?.primaryColor || "#854fff" }}
            >
              <div className="flex items-center gap-2">
                {config?.showCompanyLogo && config?.companyLogoUrl && (
                  <img
                    src={config.companyLogoUrl}
                    alt="Logo"
                    className="w-8 h-8 rounded"
                  />
                )}
                <div>
                  <p className="font-semibold">{config?.companyName || "Your Company"}</p>
                  {config?.showResponseTime && (
                    <p className="text-xs opacity-90">
                      {config?.responseTimeText || "We typically respond right away"}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {config?.showThemeToggle && (
                  <button className="text-white hover:opacity-80">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80">
                  ✖
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="text-center mb-4">
                <p className="font-semibold" style={{ color: config?.textColor || "#333" }}>
                  {config?.welcomeMessage || "Hi 👋, how can we help?"}
                </p>
              </div>

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] p-3 rounded-lg"
                    style={{
                      backgroundColor:
                        msg.role === "user"
                          ? config?.userMessageBgColor || config?.primaryColor || "#854fff"
                          : config?.aiMessageBgColor || "#f1f1f1",
                      color:
                        msg.role === "user"
                          ? config?.userMessageTextColor || "#ffffff"
                          : config?.aiTextColor || "#333333",
                      border:
                        msg.role === "assistant"
                          ? `1px solid ${config?.aiBorderColor || "#e0e0e0"}`
                          : "none",
                      borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {config?.enableTypingIndicator && (
                <div className="flex justify-start">
                  <div
                    className="p-3 rounded-lg flex gap-1"
                    style={{
                      backgroundColor: config?.aiMessageBgColor || "#f1f1f1",
                      borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                    }}
                  >
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: config?.aiBorderColor || "#e0e0e0" }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={config?.placeholderText || "Type your message..."}
                  className="flex-1 px-3 py-2 border rounded-lg outline-none"
                  style={{
                    borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                    borderColor: config?.aiBorderColor || "#e0e0e0",
                  }}
                />
                <button
                  className="px-4 py-2 text-white rounded-lg"
                  style={{
                    backgroundColor: config?.primaryColor || "#854fff",
                    borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Mobile Preview

```typescript
// components/widget-designer/MobilePreview.tsx
"use client";

import { useState } from "react";

interface MobilePreviewProps {
  config: any;
}

export function MobilePreview({ config }: MobilePreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const borderRadius = `${config?.roundness || 12}px`;
  const mobilePosition = config?.mobilePosition || "bottom";
  const mobileFullScreen = config?.mobileFullScreen || false;

  return (
    <div className="flex justify-center">
      {/* Mobile Frame */}
      <div className="w-[375px] h-[667px] bg-white rounded-[40px] shadow-2xl border-8 border-gray-800 overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-3xl z-50" />

        {/* Screen Content */}
        <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 pt-6">
          <div className="text-center pt-8">
            <p className="text-sm text-gray-500">Mobile Preview</p>
          </div>

          {/* Chat Widget */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className={`fixed ${
                mobilePosition === "bottom" ? "bottom-4" : "top-20"
              } right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40`}
              style={{
                backgroundColor: config?.primaryColor || "#854fff",
                borderRadius: borderRadius,
              }}
            >
              <span className="text-2xl">💬</span>
            </button>
          )}

          {isOpen && (
            <div
              className={`${
                mobileFullScreen
                  ? "absolute inset-0 pt-6"
                  : `absolute ${
                      mobilePosition === "bottom" ? "bottom-0" : "top-6"
                    } left-0 right-0 h-[500px]`
              } flex flex-col z-40`}
              style={{
                backgroundColor: config?.backgroundColor || "#ffffff",
                borderRadius: mobileFullScreen ? "0" : `${borderRadius} ${borderRadius} 0 0`,
              }}
            >
              {/* Header */}
              <div
                className="p-4 text-white flex justify-between items-center"
                style={{ backgroundColor: config?.primaryColor || "#854fff" }}
              >
                <div className="flex items-center gap-2">
                  {config?.showCompanyLogo && config?.companyLogoUrl && (
                    <img
                      src={config.companyLogoUrl}
                      alt="Logo"
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {config?.companyName || "Your Company"}
                    </p>
                    {config?.showResponseTime && (
                      <p className="text-xs opacity-90">
                        {config?.responseTimeText || "We typically respond right away"}
                      </p>
                    )}
                  </div>
                </div>
                
                <button onClick={() => setIsOpen(false)} className="text-white">
                  ✖
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center mb-4">
                  <p className="font-semibold text-sm" style={{ color: config?.textColor || "#333" }}>
                    {config?.welcomeMessage || "Hi 👋, how can we help?"}
                  </p>
                </div>

                <div className="flex justify-start mb-3">
                  <div
                    className="max-w-[80%] p-3 rounded-lg text-sm"
                    style={{
                      backgroundColor: config?.aiMessageBgColor || "#f1f1f1",
                      color: config?.aiTextColor || "#333333",
                      border: `1px solid ${config?.aiBorderColor || "#e0e0e0"}`,
                      borderRadius: `${(config?.roundness || 12) * 0.8}px`,
                    }}
                  >
                    {config?.firstBotMessage || "Hi there! How can we help today?"}
                  </div>
                </div>
              </div>

              {/* Input - Larger for mobile */}
              <div className="p-4 border-t" style={{ borderColor: config?.aiBorderColor || "#e0e0e0" }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={config?.placeholderText || "Type your message..."}
                    className="flex-1 px-4 py-3 border rounded-lg outline-none text-base"
                    style={{
                      borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                      borderColor: config?.aiBorderColor || "#e0e0e0",
                    }}
                  />
                  <button
                    className="px-5 py-3 text-white rounded-lg"
                    style={{
                      backgroundColor: config?.primaryColor || "#854fff",
                      borderRadius: `${(config?.roundness || 12) * 0.6}px`,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 Convex Backend Functions

```typescript
// convex/chatbot.ts - Add these functions

export const getWidgetConfig = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();
    
    // Return default config if none exists
    if (!config) {
      return {
        type: args.type,
        isActive: false,
        n8nWebhookUrl: "",
        theme: "light",
        position: "right",
        roundness: 12,
        companyName: "Your Company",
        primaryColor: "#854fff",
        secondaryColor: "#6b3fd4",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        userMessageBgColor: "#854fff",
        aiMessageBgColor: "#f1f1f1",
        userMessageTextColor: "#ffffff",
        aiMessageTextColor: "#333333",
        aiBorderColor: "#e0e0e0",
        aiTextColor: "#333333",
        welcomeMessage: "Hi 👋, how can we help?",
        responseTimeText: "We typically respond right away",
        firstBotMessage: "Hi there! How can we help today?",
        placeholderText: "Type your message...",
        showThemeToggle: false,
        showCompanyLogo: true,
        showResponseTime: true,
        enableSoundNotifications: false,
        enableTypingIndicator: true,
        mobileFullScreen: false,
        mobilePosition: "bottom",
      };
    }
    
    return config;
  },
});

export const updateWidgetConfig = mutation({
  args: {
    type: v.union(v.literal("frontend"), v.literal("user_panel")),
    config: v.object({
      isActive: v.optional(v.boolean()),
      n8nWebhookUrl: v.optional(v.string()),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
      position: v.optional(v.union(v.literal("left"), v.literal("right"))),
      roundness: v.optional(v.number()),
      companyName: v.optional(v.string()),
      companyLogoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      textColor: v.optional(v.string()),
      userMessageBgColor: v.optional(v.string()),
      aiMessageBgColor: v.optional(v.string()),
      userMessageTextColor: v.optional(v.string()),
      aiMessageTextColor: v.optional(v.string()),
      aiBorderColor: v.optional(v.string()),
      aiTextColor: v.optional(v.string()),
      welcomeMessage: v.optional(v.string()),
      responseTimeText: v.optional(v.string()),
      firstBotMessage: v.optional(v.string()),
      placeholderText: v.optional(v.string()),
      showThemeToggle: v.optional(v.boolean()),
      showCompanyLogo: v.optional(v.boolean()),
      showResponseTime: v.optional(v.boolean()),
      enableSoundNotifications: v.optional(v.boolean()),
      enableTypingIndicator: v.optional(v.boolean()),
      mobileFullScreen: v.optional(v.boolean()),
      mobilePosition: v.optional(v.union(v.literal("bottom"), v.literal("top"))),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.config,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      });
    } else {
      await ctx.db.insert("chatbot_config", {
        type: args.type,
        ...args.config,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      } as any);
    }
  },
});

export const exportWidgetCode = query({
  args: { type: v.union(v.literal("frontend"), v.literal("user_panel")) },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("chatbot_config")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!config) return null;

    // Generate embeddable widget code
    const widgetCode = `
<!-- Chat Widget -->
<script>
  window.ChatWidgetConfig = ${JSON.stringify(config, null, 2)};
</script>
<script src="https://your-domain.com/widget.js"></script>
    `.trim();

    return widgetCode;
  },
});
```

---

## 📱 Mobile Optimization Features

### Responsive Breakpoints
```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  .chat-widget {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  .chat-widget.full-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .chat-widget {
    width: 400px;
    height: 600px;
  }
}

/* Desktop: > 1024px */
@media (min-width: 1025px) {
  .chat-widget {
    width: 350px;
    height: 500px;
  }
}
```

### Touch Optimizations
- **Larger touch targets** (minimum 44x44px)
- **Swipe gestures** to close widget
- **Haptic feedback** on interactions
- **Auto-scroll** to latest message
- **Keyboard handling** - widget adjusts when keyboard appears

---

## 🚀 Implementation Checklist

### Database Setup
- [x] Enhanced `chatbot_config` table with designer fields
- [ ] Run `npx convex dev` to deploy schema

### Admin Panel
- [ ] Create `/admin/widget-designer` page
- [ ] Add `WidgetCustomizer` component
- [ ] Add `WidgetPreview` component
- [ ] Add `MobilePreview` component
- [ ] Add navigation link in admin sidebar

### Backend Functions
- [ ] Implement `getWidgetConfig` query
- [ ] Implement `updateWidgetConfig` mutation
- [ ] Implement `exportWidgetCode` query

### Testing
- [ ] Test all customization options
- [ ] Test live preview updates
- [ ] Test mobile responsiveness
- [ ] Test export functionality
- [ ] Test with both chatbot types

---

## 🎯 Usage Guide

### For Super Admins

1. **Access Widget Designer**
   - Navigate to `/admin/widget-designer`
   - Select chatbot type (Frontend or User Panel)

2. **Customize Appearance**
   - Choose theme (Light/Dark/Auto)
   - Set position (Left/Right)
   - Adjust roundness slider
   - Customize colors
   - Upload logo
   - Edit messages

3. **Preview Changes**
   - Switch between Desktop and Mobile preview
   - See changes in real-time
   - Test widget interactions

4. **Save & Deploy**
   - Click "Save Design" to persist changes
   - Widget automatically updates on frontend
   - Export code for external websites

---

**Last Updated**: January 14, 2026  
**Status**: Ready for implementation  
**Maintained by**: StartupKit Development Team

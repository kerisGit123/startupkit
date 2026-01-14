"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface WidgetCustomizerProps {
  config: any;
  onChange: (updates: any) => void;
}

export function WidgetCustomizer({ config, onChange }: WidgetCustomizerProps) {
  const [activeTab, setActiveTab] = useState<"branding" | "light" | "dark">("branding");

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Theme</Label>
          <div className="space-y-1">
            <button onClick={() => onChange({ theme: "light" })} className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${config?.theme === "light" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Light</button>
            <button onClick={() => onChange({ theme: "dark" })} className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${config?.theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Dark</button>
            <button onClick={() => onChange({ theme: "auto" })} className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${config?.theme === "auto" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Auto</button>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Position</Label>
          <div className="space-y-1">
            <button onClick={() => onChange({ position: "left" })} className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${config?.position === "left" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Left</button>
            <button onClick={() => onChange({ position: "right" })} className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${config?.position === "right" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Right</button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <Label className="text-xs font-semibold text-gray-500 uppercase">Roundness</Label>
          <span className="text-xs text-gray-600">{config?.roundness || 12}px</span>
        </div>
        <Slider value={[config?.roundness || 12]} onValueChange={(value: number[]) => onChange({ roundness: value[0] })} min={0} max={24} step={1} className="w-full" />
      </div>
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button onClick={() => setActiveTab("branding")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "branding" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Branding</button>
          <button onClick={() => setActiveTab("light")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "light" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Light Theme</button>
          <button onClick={() => setActiveTab("dark")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "dark" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>Dark Theme</button>
        </div>
      </div>
      <div className="space-y-4">
        {activeTab === "branding" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Branding</h3>
            <div><Label className="text-xs text-gray-600">Company Name</Label><Input value={config?.companyName || ""} onChange={(e) => onChange({ companyName: e.target.value })} placeholder="Your Company" className="mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-gray-600">Logo URL</Label><Input value={config?.companyLogoUrl || ""} onChange={(e) => onChange({ companyLogoUrl: e.target.value })} placeholder="https://example.com/logo.svg" className="mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-gray-600">Welcome Message</Label><Textarea value={config?.welcomeMessage || ""} onChange={(e) => onChange({ welcomeMessage: e.target.value })} placeholder="Hi, how can we help?" rows={2} className="mt-1 text-xs" /></div>
            <div><Label className="text-xs text-gray-600">Response Time Text</Label><Input value={config?.responseTimeText || ""} onChange={(e) => onChange({ responseTimeText: e.target.value })} placeholder="We typically respond right away" className="mt-1 h-8 text-xs" /></div>
            <div><Label className="text-xs text-gray-600">First Bot Message</Label><Textarea value={config?.firstBotMessage || ""} onChange={(e) => onChange({ firstBotMessage: e.target.value })} placeholder="Hi there! How can we help today?" rows={2} className="mt-1 text-xs" /></div>
          </div>
        )}
        {activeTab === "light" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Light Theme Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-600 uppercase">Primary</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.primaryColor || "#6366f1"} onChange={(e) => onChange({ primaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.primaryColor || "#6366f1"} onChange={(e) => onChange({ primaryColor: e.target.value })} placeholder="#6366f1" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Secondary</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.secondaryColor || "#8b5cf6"} onChange={(e) => onChange({ secondaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.secondaryColor || "#8b5cf6"} onChange={(e) => onChange({ secondaryColor: e.target.value })} placeholder="#8b5cf6" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Background</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.backgroundColor || "#ffffff"} onChange={(e) => onChange({ backgroundColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.backgroundColor || "#ffffff"} onChange={(e) => onChange({ backgroundColor: e.target.value })} placeholder="#ffffff" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.textColor || "#333333"} onChange={(e) => onChange({ textColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.textColor || "#333333"} onChange={(e) => onChange({ textColor: e.target.value })} placeholder="#333333" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
            </div>
            <h4 className="text-xs font-medium text-gray-700 mt-4 mb-2">Message Bubbles</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-600 uppercase">User Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.userMessageTextColor || "#ffffff"} onChange={(e) => onChange({ userMessageTextColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.userMessageTextColor || "#ffffff"} onChange={(e) => onChange({ userMessageTextColor: e.target.value })} placeholder="#ffffff" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Background</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.aiMessageBgColor || "#f3f4f6"} onChange={(e) => onChange({ aiMessageBgColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.aiMessageBgColor || "#f3f4f6"} onChange={(e) => onChange({ aiMessageBgColor: e.target.value })} placeholder="#f3f4f6" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Border</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.aiBorderColor || "#e5e7eb"} onChange={(e) => onChange({ aiBorderColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.aiBorderColor || "#e5e7eb"} onChange={(e) => onChange({ aiBorderColor: e.target.value })} placeholder="#e5e7eb" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.aiTextColor || "#666666"} onChange={(e) => onChange({ aiTextColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.aiTextColor || "#666666"} onChange={(e) => onChange({ aiTextColor: e.target.value })} placeholder="#666666" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
            </div>
          </div>
        )}
        {activeTab === "dark" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Dark Theme Colors</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-600 uppercase">Primary</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkPrimaryColor || "#818cf8"} onChange={(e) => onChange({ darkPrimaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkPrimaryColor || "#818cf8"} onChange={(e) => onChange({ darkPrimaryColor: e.target.value })} placeholder="#818cf8" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Secondary</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkSecondaryColor || "#a78bfa"} onChange={(e) => onChange({ darkSecondaryColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkSecondaryColor || "#a78bfa"} onChange={(e) => onChange({ darkSecondaryColor: e.target.value })} placeholder="#a78bfa" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Background</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkBackgroundColor || "#1f2937"} onChange={(e) => onChange({ darkBackgroundColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkBackgroundColor || "#1f2937"} onChange={(e) => onChange({ darkBackgroundColor: e.target.value })} placeholder="#1f2937" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkTextColor || "#f9fafb"} onChange={(e) => onChange({ darkTextColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkTextColor || "#f9fafb"} onChange={(e) => onChange({ darkTextColor: e.target.value })} placeholder="#f9fafb" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
            </div>
            <h4 className="text-xs font-medium text-gray-700 mt-4 mb-2">Message Bubbles</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-gray-600 uppercase">User Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkUserMessageTextColor || "#ffffff"} onChange={(e) => onChange({ darkUserMessageTextColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkUserMessageTextColor || "#ffffff"} onChange={(e) => onChange({ darkUserMessageTextColor: e.target.value })} placeholder="#ffffff" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Background</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkAiMessageBgColor || "#374151"} onChange={(e) => onChange({ darkAiMessageBgColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkAiMessageBgColor || "#374151"} onChange={(e) => onChange({ darkAiMessageBgColor: e.target.value })} placeholder="#374151" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Border</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkAiBorderColor || "#4b5563"} onChange={(e) => onChange({ darkAiBorderColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkAiBorderColor || "#4b5563"} onChange={(e) => onChange({ darkAiBorderColor: e.target.value })} placeholder="#4b5563" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
              <div><Label className="text-xs text-gray-600 uppercase">AI Text</Label><div className="flex gap-1 mt-1"><Input type="color" value={config?.darkAiTextColor || "#e5e7eb"} onChange={(e) => onChange({ darkAiTextColor: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" /><Input value={config?.darkAiTextColor || "#e5e7eb"} onChange={(e) => onChange({ darkAiTextColor: e.target.value })} placeholder="#e5e7eb" className="flex-1 font-mono text-xs h-8 px-2" /></div></div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2 pt-4 border-t">
        <h3 className="font-semibold text-sm">Features</h3>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="showThemeToggle" checked={config?.showThemeToggle ?? true} onChange={(e) => onChange({ showThemeToggle: e.target.checked })} className="rounded border-gray-300" />
          <label htmlFor="showThemeToggle" className="text-xs cursor-pointer">Show Theme Toggle</label>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";

export default function SettingsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { companyId } = useCompany();
  
  const settings = useQuery(
    api.settings.getSettings,
    companyId ? { companyId } : "skip"
  );
  
  const updateSettings = useMutation(api.settings.updateSettings);
  
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with existing settings using useEffect
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setEmail(settings.email || "");
      setContactNumber(settings.contactNumber || "");
      setAddress(settings.address || "");
      setAiEnabled(settings.aiEnabled ?? true);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId || !user) {
      alert("Please sign in to update settings");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        companyId,
        companyName: companyName || undefined,
        email: email || undefined,
        contactNumber: contactNumber || undefined,
        address: address || undefined,
        aiEnabled,
        updatedBy: user.id,
      });
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-900">Please sign in to access settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and set e-mail preferences.</p>
        </div>
        
        <div className="border-b mb-6"></div>
        
        <div className="flex gap-12">
          {/* Left Sidebar Navigation */}
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              <button className="w-full text-left px-0 py-1 text-sm font-medium text-foreground">Profile</button>
              <button className="w-full text-left px-0 py-1 text-sm text-muted-foreground hover:text-foreground">Account</button>
              <button className="w-full text-left px-0 py-1 text-sm text-muted-foreground hover:text-foreground">Appearance</button>
              <button className="w-full text-left px-0 py-1 text-sm text-muted-foreground hover:text-foreground">Notifications</button>
              <button className="w-full text-left px-0 py-1 text-sm text-muted-foreground hover:text-foreground">Display</button>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">This is how others will see you on the site.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    placeholder="shadcn"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-muted text-foreground"
                    placeholder="Select a verified email to display"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can manage verified email addresses in your email settings.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Bio
                  </label>
                  <textarea
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none"
                    placeholder="I own a computer."
                  />
                  <p className="text-xs text-muted-foreground">
                    You can @mention other users and organizations to link to them.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                  >
                    {isSaving ? "Updating..." : "Update profile"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

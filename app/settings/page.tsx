"use client";

import { useState, useEffect } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "@/hooks/useCompany";
import { CompanyInfoSection } from "./components/CompanyInfoSection";
import { ApiKeysSection } from "./components/ApiKeysSection";

export default function SettingsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { companyId } = useCompany();
  
  const settings = useQuery(
    api.settings.getSettings,
    companyId ? { companyId } : "skip"
  );
  
  const updateSettings = useMutation(api.settings.updateSettings);
  
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile fields
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Company Information fields
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companyTin, setCompanyTin] = useState("");
  const [companyLicense, setCompanyLicense] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyTimezone, setCompanyTimezone] = useState("");
  const [companyCurrency, setCompanyCurrency] = useState("");
  const [companyNote, setCompanyNote] = useState("");
  
  // API Keys fields
  const [secretKey, setSecretKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiSecret, setOpenaiSecret] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with existing settings using useEffect
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setEmail(settings.email || "");
      setContactNumber(settings.contactNumber || "");
      setAddress(settings.address || "");
      setAiEnabled(settings.aiEnabled ?? true);
      
      // Company Information
      setCompanyAddress(settings.companyAddress || "");
      setCompanyCountry(settings.companyCountry || "");
      setCompanyTin(settings.companyTin || "");
      setCompanyLicense(settings.companyLicense || "");
      setCompanyPhone(settings.companyPhone || "");
      setCompanyEmail(settings.companyEmail || "");
      setCompanyWebsite(settings.companyWebsite || "");
      setCompanyTimezone(settings.companyTimezone || "");
      setCompanyCurrency(settings.companyCurrency || "");
      setCompanyNote(settings.companyNote || "");
      
      // API Keys
      setSecretKey(settings.secretKey || "");
      setOpenaiKey(settings.openaiKey || "");
      setOpenaiSecret(settings.openaiSecret || "");
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
        
        // Company Information
        companyAddress: companyAddress || undefined,
        companyCountry: companyCountry || undefined,
        companyTin: companyTin || undefined,
        companyLicense: companyLicense || undefined,
        companyPhone: companyPhone || undefined,
        companyEmail: companyEmail || undefined,
        companyWebsite: companyWebsite || undefined,
        companyTimezone: companyTimezone || undefined,
        companyCurrency: companyCurrency || undefined,
        companyNote: companyNote || undefined,
        
        // API Keys
        secretKey: secretKey || undefined,
        openaiKey: openaiKey || undefined,
        openaiSecret: openaiSecret || undefined,
        
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
              <button 
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-0 py-1 text-sm ${
                  activeTab === "profile" 
                    ? "font-medium text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab("company")}
                className={`w-full text-left px-0 py-1 text-sm ${
                  activeTab === "company" 
                    ? "font-medium text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Company Info
              </button>
              <button 
                onClick={() => setActiveTab("api")}
                className={`w-full text-left px-0 py-1 text-sm ${
                  activeTab === "api" 
                    ? "font-medium text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                API Configuration
              </button>
              <button 
                onClick={() => setActiveTab("appearance")}
                className={`w-full text-left px-0 py-1 text-sm ${
                  activeTab === "appearance" 
                    ? "font-medium text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Appearance
              </button>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">This is how others will see you on the site.</p>
                  </div>
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
                </div>
              )}

              {activeTab === "company" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Company Information</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your company details and business information.</p>
                  </div>
                  
                  <CompanyInfoSection
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    companyAddress={companyAddress}
                    setCompanyAddress={setCompanyAddress}
                    companyCountry={companyCountry}
                    setCompanyCountry={setCompanyCountry}
                    companyTin={companyTin}
                    setCompanyTin={setCompanyTin}
                    companyLicense={companyLicense}
                    setCompanyLicense={setCompanyLicense}
                    companyPhone={companyPhone}
                    setCompanyPhone={setCompanyPhone}
                    companyEmail={companyEmail}
                    setCompanyEmail={setCompanyEmail}
                    companyWebsite={companyWebsite}
                    setCompanyWebsite={setCompanyWebsite}
                    companyTimezone={companyTimezone}
                    setCompanyTimezone={setCompanyTimezone}
                    companyCurrency={companyCurrency}
                    setCompanyCurrency={setCompanyCurrency}
                    companyNote={companyNote}
                    setCompanyNote={setCompanyNote}
                  />
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                    >
                      {isSaving ? "Saving..." : "Save Company Info"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "api" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">API Configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your API keys and integration secrets.</p>
                  </div>
                  
                  <ApiKeysSection
                    secretKey={secretKey}
                    setSecretKey={setSecretKey}
                    openaiKey={openaiKey}
                    setOpenaiKey={setOpenaiKey}
                    openaiSecret={openaiSecret}
                    setOpenaiSecret={setOpenaiSecret}
                  />
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                    >
                      {isSaving ? "Saving..." : "Save API Keys"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
                    <p className="text-sm text-muted-foreground mt-1">Customize the appearance of the app.</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Appearance settings coming soon...</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-mono text-sm text-gray-900">{user.id}</p>
            </div>
            {organization && (
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium text-gray-900">{organization.name}</p>
                <p className="font-mono text-sm text-gray-500">{organization.id}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Tenant ID</p>
              <p className="font-mono text-sm text-gray-900">{companyId}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Organization Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-black"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-black"
                placeholder="company@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-black"
                placeholder="+60 12-345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none text-black"
                placeholder="Enter company address"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="aiEnabled"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              />
              <label htmlFor="aiEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Enable AI Features
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition shadow-sm"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = "/dashboard"}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

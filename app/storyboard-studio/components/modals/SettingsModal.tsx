"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Settings, Building2, Key } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<"company" | "aikey">("company");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load org_settings
  const settings = useQuery(api.companySettings.getCompanySettings);
  const updateSettings = useMutation(api.companySettings.updateCompanySettings);

  // Load KIE AI keys for defaultAI dropdown
  const [kieKeys, setKieKeys] = useState<Array<{ _id: string; name: string; isDefault: boolean; isActive: boolean }>>([]);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyCountry: "",
    companyAddress: "",
    companyTin: "",
    companyLicense: "",
    companyNote: "",
  });

  // AI key state
  const [selectedAIKey, setSelectedAIKey] = useState("");

  // Sync form with loaded settings
  useEffect(() => {
    if (settings) {
      setCompanyForm({
        companyName: settings.companyName || "",
        companyEmail: settings.companyEmail || "",
        companyPhone: settings.companyPhone || "",
        companyCountry: settings.companyCountry || "",
        companyAddress: settings.companyAddress || "",
        companyTin: settings.companyTin || "",
        companyLicense: settings.companyLicense || "",
        companyNote: settings.companyNote || "",
      });
      setSelectedAIKey(settings.defaultAI || "");
    }
  }, [settings]);

  // Fetch KIE keys
  useEffect(() => {
    fetch("/api/storyboard/pricing/kie")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setKieKeys(data); })
      .catch(() => {});
  }, []);

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await updateSettings({
        companyName: companyForm.companyName || undefined,
        companyEmail: companyForm.companyEmail || undefined,
        companyPhone: companyForm.companyPhone || undefined,
        companyCountry: companyForm.companyCountry || undefined,
        companyAddress: companyForm.companyAddress || undefined,
        companyTin: companyForm.companyTin || undefined,
        companyLicense: companyForm.companyLicense || undefined,
        companyNote: companyForm.companyNote || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAIKey = async () => {
    setSaving(true);
    try {
      await updateSettings({
        defaultAI: selectedAIKey ? selectedAIKey as any : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to save AI key:", e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const defaultKieKey = kieKeys.find((k) => k.isDefault);
  const activeAI = selectedAIKey
    ? kieKeys.find((k) => k._id === selectedAIKey)
    : defaultKieKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Settings</h2>
              <p className="text-sm text-gray-400">Manage your company and AI configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#0f1117] rounded-lg p-1">
          <button onClick={() => setActiveSettingsTab("company")}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeSettingsTab === "company" ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-gray-300"}`}>
            <Building2 className="w-3.5 h-3.5" /> Company
          </button>
          <button onClick={() => setActiveSettingsTab("aikey")}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeSettingsTab === "aikey" ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-gray-300"}`}>
            <Key className="w-3.5 h-3.5" /> Default AI Key
          </button>
        </div>

        <div className="space-y-4">
          {/* Company Tab */}
          {activeSettingsTab === "company" && (
          <>
            <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">Company Information</h3>
                  <p className="text-xs text-gray-500">Used in email templates and communications</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Company Name *</label>
                    <input type="text" value={companyForm.companyName}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Your company name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Company Email *</label>
                    <input type="email" value={companyForm.companyEmail}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyEmail: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="contact@company.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Phone</label>
                    <input type="text" value={companyForm.companyPhone}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyPhone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="+60123456789" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Country</label>
                    <input type="text" value={companyForm.companyCountry}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyCountry: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Malaysia" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Address</label>
                  <textarea value={companyForm.companyAddress} rows={2}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyAddress: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Company address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Tax ID (TIN)</label>
                    <input type="text" value={companyForm.companyTin}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyTin: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Tax identification number" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">Business License</label>
                    <input type="text" value={companyForm.companyLicense}
                      onChange={(e) => setCompanyForm({ ...companyForm, companyLicense: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Business license number" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1.5">Notes</label>
                  <textarea value={companyForm.companyNote} rows={2}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyNote: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Internal notes" />
                </div>
              </div>
            </div>

            <button onClick={handleSaveCompany} disabled={saving}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                saveSuccess ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              }`}>
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Company Settings"}
            </button>
          </>
          )}

          {/* Default AI Key Tab */}
          {activeSettingsTab === "aikey" && (
          <>
            <div className="bg-[#25252f] rounded-xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">Default AI Key</h3>
                  <p className="text-xs text-gray-500">Select which KIE AI key to use for all AI generation requests</p>
                </div>
              </div>

              {kieKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No API keys configured</p>
                  <p className="text-xs text-gray-500 mt-1">Add API keys in Pricing Management → KIE AI tab</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kieKeys.filter(k => k.isActive).map((key) => (
                    <label
                      key={key._id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        (selectedAIKey === key._id || (!selectedAIKey && key.isDefault))
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-white/10 bg-[#1a1a24] hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="defaultAI"
                        value={key._id}
                        checked={selectedAIKey === key._id || (!selectedAIKey && key.isDefault)}
                        onChange={() => setSelectedAIKey(key._id)}
                        className="w-4 h-4 text-emerald-500 accent-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{key.name}</span>
                          {key.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">SYSTEM DEFAULT</span>
                          )}
                        </div>
                      </div>
                      {(selectedAIKey === key._id || (!selectedAIKey && key.isDefault)) && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {activeAI && (
              <div className="bg-[#1a1a24] rounded-xl p-4 border border-emerald-500/20">
                <p className="text-xs text-gray-400">Currently active:</p>
                <p className="text-sm text-emerald-400 font-medium mt-1">{activeAI.name}</p>
              </div>
            )}

            <button onClick={handleSaveAIKey} disabled={saving || kieKeys.length === 0}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                saveSuccess ? "bg-green-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              }`}>
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Default AI Key"}
            </button>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

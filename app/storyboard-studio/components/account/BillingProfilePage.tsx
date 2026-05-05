"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Building2, MapPin, Globe, Phone, FileText, Hash,
  Save, Loader2, User, ChevronLeft, ChevronRight,
} from "lucide-react";

interface BillingProfilePageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const FIELD_CONFIG = [
  {
    key: "companyName",
    label: "Company Name",
    placeholder: "Acme Sdn Bhd",
    icon: Building2,
    hint: "Legal name of your business",
  },
  {
    key: "billingAddress",
    label: "Company Address",
    placeholder: "No. 1, Jalan Contoh, Taman Maju",
    icon: MapPin,
    hint: "Street address for billing documents",
    textarea: true,
  },
  {
    key: "country",
    label: "Country",
    placeholder: "Malaysia",
    icon: Globe,
    hint: "Country of registration",
  },
  {
    key: "phone",
    label: "Contact Number",
    placeholder: "+60 12-345 6789",
    icon: Phone,
    hint: "Primary business phone",
  },
  {
    key: "companyLicense",
    label: "Company Registration No.",
    placeholder: "202301234567 (1234567-A)",
    icon: FileText,
    hint: "SSM or equivalent registration number",
  },
  {
    key: "tinNumber",
    label: "TIN / Tax ID",
    placeholder: "SG 12345678900",
    icon: Hash,
    hint: "Tax Identification Number (for invoices)",
  },
] as const;

type ProfileKey = typeof FIELD_CONFIG[number]["key"];

export default function BillingProfilePage({ sidebarOpen, onToggleSidebar }: BillingProfilePageProps) {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  const profile = useQuery(
    api.adminUserManagement.getUserBillingProfile,
    clerkUserId ? { clerkUserId } : "skip",
  );

  const updateProfile = useMutation(api.adminUserManagement.updateUserBillingProfile);

  const [form, setForm] = useState<Record<ProfileKey, string>>({
    companyName: "",
    billingAddress: "",
    country: "",
    phone: "",
    companyLicense: "",
    tinNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName ?? "",
        billingAddress: profile.billingAddress ?? "",
        country: profile.country ?? "",
        phone: profile.phone ?? "",
        companyLicense: profile.companyLicense ?? "",
        tinNumber: profile.tinNumber ?? "",
      });
    }
  }, [profile]);

  function handleChange(key: ProfileKey, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    if (!clerkUserId) return;
    setSaving(true);
    try {
      await updateProfile({
        clerkUserId,
        companyName: form.companyName || undefined,
        billingAddress: form.billingAddress || undefined,
        country: form.country || undefined,
        phone: form.phone || undefined,
        companyLicense: form.companyLicense || undefined,
        tinNumber: form.tinNumber || undefined,
      });
      setDirty(false);
      toast.success("Billing profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const isComplete = FIELD_CONFIG.every(f => !!form[f.key]);
  const filledCount = FIELD_CONFIG.filter(f => !!form[f.key]).length;

  return (
    <div className="flex flex-col h-full bg-(--bg-primary) text-(--text-primary)">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-(--bg-tertiary) text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              My Billing Profile
            </h1>
            <p className="text-xs text-(--text-tertiary) mt-0.5">
              Used on offline invoices issued to your account
            </p>
          </div>
        </div>
        <button
          disabled={!dirty || saving}
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          title="Save billing profile"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Completeness bar */}
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile completeness</span>
              <span className={`text-xs font-semibold ${isComplete ? "text-emerald-400" : "text-(--text-tertiary)"}`}>
                {filledCount}/{FIELD_CONFIG.length} fields
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-(--bg-tertiary) overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(filledCount / FIELD_CONFIG.length) * 100}%` }}
              />
            </div>
            {!isComplete && (
              <p className="text-xs text-(--text-tertiary) mt-2">
                Complete all fields so your invoices show accurate business information.
              </p>
            )}
          </div>

          {/* User identity (read-only) */}
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-5">
            <h2 className="text-sm font-semibold text-(--text-secondary) mb-3 uppercase tracking-wider">
              Account Identity
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Full Name</p>
                <p className="text-sm font-medium">{user?.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary) mb-1">Email</p>
                <p className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress || "—"}</p>
              </div>
            </div>
            <p className="text-xs text-(--text-tertiary) mt-3">
              Name and email are managed via your Clerk account settings.
            </p>
          </div>

          {/* Billing fields */}
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-secondary) p-5">
            <h2 className="text-sm font-semibold text-(--text-secondary) mb-4 uppercase tracking-wider">
              Business / Billing Info
            </h2>
            <div className="space-y-4">
              {FIELD_CONFIG.map(({ key, label, placeholder, icon: Icon, hint, textarea }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-(--text-secondary) mb-1.5 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </label>
                  {textarea ? (
                    <textarea
                      value={form[key]}
                      onChange={e => handleChange(key, e.target.value)}
                      placeholder={placeholder}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-(--border-primary) bg-(--bg-tertiary) text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-amber-400/50 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={form[key]}
                      onChange={e => handleChange(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-(--border-primary) bg-(--bg-tertiary) text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-amber-400/50"
                    />
                  )}
                  <p className="text-xs text-(--text-tertiary) mt-1">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Save button (bottom) */}
          <button
            disabled={!dirty || saving}
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Billing Profile"}
          </button>

          <p className="text-xs text-center text-(--text-tertiary)">
            This information will be pre-filled on offline invoices created by your account manager.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown, CreditCard,
  CheckCircle2, Zap, Building2, Download, Eye, Receipt,
  Calendar, TrendingUp, Coins, Crown, Star, ArrowUpRight,
  Info, AlertCircle, Shield, Sparkles, CreditCard as CreditCardIcon,
} from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useCompany } from "@/hooks/useCompany";
import { getCreditPackages } from "@/lib/credit-pricing";
import CreditBalanceDisplay from "./CreditBalanceDisplay";

interface BillingSubscriptionPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    priceLabel: "MYR 0.00/month",
    features: ["5 AI generations/month", "1 project", "Basic export"],
    maxOrgs: 0,
  },
  {
    key: "starter",
    name: "Starter",
    price: 19.9,
    priceLabel: "MYR 19.90/month",
    features: ["50 AI generations/month", "10 projects", "Organization", "HD export"],
    maxOrgs: 1,
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "MYR 29.00/month",
    features: ["200 AI generations/month", "Unlimited projects", "Organization", "AI Summary", "Priority support"],
    maxOrgs: 3,
    popular: true,
  },
];


const MOCK_INVOICES = [
  { id: "INV-260007", date: "Feb 10, 2026", type: "Payment", description: "500 Credits Top-up", amount: "MYR 40.00", status: "Paid" },
  { id: "INV-260006", date: "Feb 10, 2026", type: "Subscription", description: "Pro - Subscription", amount: "MYR 29.00", status: "Paid" },
  { id: "INV-260005", date: "Jan 12, 2026", type: "Subscription", description: "Pro - Subscription", amount: "MYR 29.00", status: "Paid" },
  { id: "INV-260004", date: "Jan 10, 2026", type: "Payment", description: "100 Credits Top-up", amount: "MYR 10.00", status: "Paid" },
];

const statusColor: Record<string, string> = {
  Paid: "bg-emerald-500/20 text-emerald-400",
  Pending: "bg-yellow-500/20 text-yellow-400",
  Cancelled: "bg-red-500/20 text-red-400",
  Draft: "bg-gray-500/20 text-gray-400",
};

const typeColor: Record<string, string> = {
  Payment: "bg-blue-500/20 text-blue-400",
  Subscription: "bg-purple-500/20 text-purple-400",
};

export default function BillingSubscriptionPage({ sidebarOpen, onToggleSidebar }: BillingSubscriptionPageProps) {
  const { user } = useUser();
  const { companyId } = useCompany();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currentPlan] = useState("starter");
  const [activeTab, setActiveTab] = useState<"overview" | "credits" | "plans" | "invoices">("overview");
  const creditPackages = getCreditPackages();

  const handleBuyCredits = async (tokens: number, amount: number) => {
    if (!user || !companyId) {
      alert("Please sign in to buy credits");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          tokens,
          amount,
          companyId,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary) bg-(--bg-secondary) shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-(--text-secondary) transition hover:text-(--text-primary) md:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-(--text-primary)">Billing & Subscription</h1>
            <ChevronDown className="w-4 h-4 text-(--text-tertiary)" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center self-end md:flex lg:self-auto">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-sm mr-3",
                },
              }}
            />
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-(--bg-primary) to-(--bg-secondary)">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          
          {/* ── Header with Tabs ────────────────────────────────────── */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-(--text-primary) mb-3">
                Billing & Subscription
              </h1>
              <p className="text-lg text-(--text-secondary) max-w-2xl mx-auto">
                Manage your plan, credits, and billing all in one place
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center">
              <div className="inline-flex items-center rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) p-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === "overview" 
                      ? "bg-(--accent-purple) text-white shadow-lg" 
                      : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("credits")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === "credits" 
                      ? "bg-(--accent-purple) text-white shadow-lg" 
                      : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Credits
                </button>
                <button
                  onClick={() => setActiveTab("plans")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === "plans" 
                      ? "bg-(--accent-purple) text-white shadow-lg" 
                      : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Plans
                </button>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === "invoices" 
                      ? "bg-(--accent-purple) text-white shadow-lg" 
                      : "text-(--text-secondary) hover:text-(--text-primary)"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Invoices
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Current Plan Overview */}
              <div className="relative">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-(--accent-purple)/20 to-emerald-500/20 rounded-3xl blur-3xl"></div>
                
                <div className="relative bg-gradient-to-br from-(--bg-secondary) via-(--bg-tertiary) to-(--bg-secondary) border border-(--border-primary) rounded-3xl p-8 lg:p-12 shadow-2xl">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    
                    {/* Plan Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-(--accent-purple) to-purple-600 flex items-center justify-center shadow-lg">
                          <Crown className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white capitalize">{currentPlan} Plan</h2>
                            <span className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-lg">
                              Active
                            </span>
                          </div>
                          <p className="text-(--text-secondary) text-lg">Your current subscription plan</p>
                        </div>
                      </div>

                      {/* Plan Features Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-white mb-1">
                                {currentPlan === 'free' ? '0' : currentPlan === 'starter' ? '50' : '200'}
                              </p>
                              <p className="text-sm text-(--text-secondary) uppercase tracking-wider">Credits/Month</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-white mb-1">
                                {currentPlan === 'free' ? '0' : currentPlan === 'starter' ? '1' : '3'}
                              </p>
                              <p className="text-sm text-(--text-secondary) uppercase tracking-wider">Organizations</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                              <Star className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-3xl font-bold text-white mb-1">
                                {currentPlan === 'free' ? '1' : 'Unlimited'}
                              </p>
                              <p className="text-sm text-(--text-secondary) uppercase tracking-wider">Projects</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Billing Actions */}
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-(--text-secondary) mb-1">Next billing date</p>
                            <p className="text-lg font-semibold text-white">April 10, 2026</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-200 font-medium">
                              Manage Plan
                            </button>
                            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg">
                              Upgrade Plan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Credits Overview */}
                    <div className="lg:w-96">
                      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/30">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
                            <Coins className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Credits</h3>
                            <p className="text-emerald-200">Current balance</p>
                          </div>
                        </div>
                        
                        <div className="text-center mb-6">
                          <p className="text-5xl font-bold text-white mb-2">488</p>
                          <p className="text-emerald-200 text-sm uppercase tracking-wider">Available Credits</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white mb-1">12</p>
                            <p className="text-xs text-emerald-200 uppercase tracking-wider">Used</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white mb-1">36</p>
                            <p className="text-xs text-emerald-200 uppercase tracking-wider">Remaining</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                          <p className="text-xs text-emerald-200 text-center flex items-center justify-center gap-2">
                            <Shield className="w-3 h-3" />
                            Credits never expire
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "credits" && (
            <div className="space-y-8">
              {/* Credits Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-(--text-primary) mb-3 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-emerald-400" />
                  </div>
                  Buy Credits
                </h2>
                <p className="text-lg text-(--text-secondary) max-w-2xl mx-auto">
                  Purchase credits anytime for additional AI generations. Credits never expire.
                </p>
              </div>

              {/* Credit Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {creditPackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className={`relative group transition-all duration-300 ${
                      pkg.highlighted
                        ? "transform scale-105"
                        : "hover:transform hover:scale-105"
                    }`}
                  >
                    {/* Glow effect for highlighted package */}
                    {pkg.highlighted && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl blur-xl"></div>
                    )}
                    
                    <div className={`relative bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border rounded-3xl p-8 transition-all duration-300 ${
                      pkg.highlighted
                        ? "border-emerald-500/50 shadow-2xl"
                        : "border-(--border-primary) hover:border-(--accent-purple)/50 hover:shadow-xl"
                    }`}>
                      {pkg.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                          {pkg.badge}
                        </span>
                      )}
                      
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                          <Coins className="w-8 h-8 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-2">{pkg.credits}</p>
                        <p className="text-(--text-secondary) uppercase tracking-wider text-sm mb-4">Credits</p>
                        <p className="text-4xl font-bold text-white mb-2">{pkg.price}</p>
                        <p className="text-emerald-400 text-sm">MYR {(pkg.amountInCents / pkg.credits / 100).toFixed(2)}/credit</p>
                      </div>
                      
                      <button 
                        onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents)}
                        className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                          pkg.highlighted
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg"
                            : "bg-(--accent-purple) text-white hover:bg-purple-600"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          Buy Now
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "plans" && (
            <div className="space-y-8">
              {/* Plans Header */}
              <div className="text-center mb-12">
                <h2 className="text-2xl lg:text-3xl font-bold text-(--text-primary) mb-3 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-(--accent-purple)/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-(--accent-purple)" />
                  </div>
                  Choose Your Plan
                </h2>
                <p className="text-lg text-(--text-secondary) max-w-2xl mx-auto mb-8">
                  Select the perfect plan for your creative workflow
                </p>
                
                {/* Billing Toggle */}
                <div className="inline-flex items-center gap-2 rounded-2xl bg-(--bg-tertiary) border border-(--border-primary) p-1.5">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      billingCycle === "monthly" 
                        ? "bg-(--accent-purple) text-white shadow-lg" 
                        : "text-(--text-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      billingCycle === "yearly" 
                        ? "bg-(--accent-purple) text-white shadow-lg" 
                        : "text-(--text-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    Yearly
                    <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">Save 20%</span>
                  </button>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {PLANS.map((plan) => {
                  const isCurrent = plan.key === currentPlan;
                  const yearlyPrice = Math.round(plan.price * 12 * 0.8 * 100) / 100;
                  const displayPrice = billingCycle === "yearly" && plan.price > 0
                    ? `MYR ${yearlyPrice.toFixed(2)}/year`
                    : plan.priceLabel;

                  return (
                    <div
                      key={plan.key}
                      className={`relative group transition-all duration-300 ${
                        isCurrent ? "transform scale-105" : "hover:transform hover:scale-105"
                      }`}
                    >
                      {/* Background glow for current plan */}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-gradient-to-r from-(--accent-purple)/20 to-purple-600/20 rounded-3xl blur-xl"></div>
                      )}
                      
                      <div className={`relative bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border rounded-3xl p-8 transition-all duration-300 h-full flex flex-col ${
                        isCurrent
                          ? "border-(--accent-purple)/50 shadow-2xl"
                          : "border-(--border-primary) hover:border-(--accent-purple)/50 hover:shadow-xl"
                      }`}>
                        {isCurrent && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                            Current Plan
                          </span>
                        )}
                        
                        {/* Plan Header */}
                        <div className="text-center mb-8">
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                            plan.key === 'free' 
                              ? 'bg-gray-500/20'
                              : plan.key === 'starter'
                              ? 'bg-blue-500/20'
                              : 'bg-purple-500/20'
                          }`}>
                            {plan.key === 'free' ? (
                              <Star className="w-10 h-10 text-gray-400" />
                            ) : plan.key === 'starter' ? (
                              <Zap className="w-10 h-10 text-blue-400" />
                            ) : (
                              <Crown className="w-10 h-10 text-purple-400" />
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                          <p className="text-3xl font-bold text-white mb-1">{displayPrice}</p>
                          {plan.price > 0 && billingCycle === "yearly" && (
                            <p className="text-emerald-400 text-sm">Save 20% vs monthly</p>
                          )}
                        </div>
                        
                        {/* Features */}
                        <div className="flex-1 mb-8">
                          <ul className="space-y-4">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-3 text-(--text-secondary)">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* CTA */}
                        <div className="mt-auto">
                          {isCurrent ? (
                            <div className="space-y-3">
                              <button className="w-full py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-200 font-medium">
                                Manage Subscription
                              </button>
                              <button className="w-full py-3 text-red-400 hover:text-red-300 transition-all duration-200 text-sm">
                                Cancel Plan
                              </button>
                            </div>
                          ) : plan.price === 0 ? (
                            <button className="w-full py-4 rounded-xl border border-white/20 text-white cursor-default font-medium">
                              Free Forever
                            </button>
                          ) : (
                            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-(--accent-purple) to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg">
                              Subscribe
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="space-y-8">
              {/* Invoices Header */}
              <div className="text-center mb-12">
                <h2 className="text-2xl lg:text-3xl font-bold text-(--text-primary) mb-3 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-blue-400" />
                  </div>
                  Invoice History
                </h2>
                <p className="text-lg text-(--text-secondary) max-w-2xl mx-auto">
                  Track your billing history and download invoices
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 max-w-6xl mx-auto">
                {[
                  { label: "Total Invoices", value: "4", icon: Receipt, color: "from-blue-500/20 to-blue-600/20", iconColor: "text-blue-400", borderColor: "border-blue-500/30" },
                  { label: "Total Amount", value: "MYR 108.00", icon: TrendingUp, color: "from-purple-500/20 to-purple-600/20", iconColor: "text-purple-400", borderColor: "border-purple-500/30" },
                  { label: "Paid", value: "MYR 108.00", icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/20", iconColor: "text-emerald-400", borderColor: "border-emerald-500/30" },
                  { label: "Pending", value: "MYR 0.00", icon: Calendar, color: "from-yellow-500/20 to-yellow-600/20", iconColor: "text-yellow-400", borderColor: "border-yellow-500/30" },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-2xl p-6 border ${stat.borderColor} transition-all duration-300 hover:scale-105`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm text-(--text-secondary) mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invoice Table */}
              <div className="max-w-6xl mx-auto">
                <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-(--border-primary) bg-(--bg-tertiary)/50">
                          {["Invoice #", "Date", "Type", "Description", "Amount", "Status", "Actions"].map((header) => (
                            <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_INVOICES.map((inv, index) => (
                          <tr
                            key={inv.id}
                            className={`border-b border-(--border-primary) last:border-0 hover:bg-(--bg-tertiary)/30 transition-all duration-200 ${
                              index % 2 === 0 ? "" : "bg-(--bg-primary)/20"
                            }`}
                          >
                            <td className="px-6 py-4 text-sm font-mono text-white font-semibold">{inv.id}</td>
                            <td className="px-6 py-4 text-sm text-(--text-secondary)">{inv.date}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                inv.type === "Payment" 
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              }`}>
                                {inv.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-white">{inv.description}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-white">{inv.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                inv.status === "Paid" 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : inv.status === "Pending"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center text-(--text-secondary) hover:text-white">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center text-(--text-secondary) hover:text-white">
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
);
}

"use client";

import { useState, useMemo } from "react";
import {
  PanelLeftClose, PanelLeftOpen, ChevronDown, CreditCard,
  CheckCircle2, Zap, Building2, Download, Eye, Receipt,
  Calendar, TrendingUp, Coins, Crown, Star, ArrowUpRight,
  Info, AlertCircle, Shield, Sparkles, CreditCard as CreditCardIcon,
  Loader2, FileText, DollarSign, Search, User,
} from "lucide-react";
import { PricingTable } from "@clerk/nextjs";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { dark } from "@clerk/ui/themes";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCompany } from "@/hooks/useCompany";
import { useSubscription } from "@/hooks/useSubscription";
import { getCreditPackages } from "@/lib/credit-pricing";
import CreditBalanceDisplay from "./CreditBalanceDisplay";
import { TransferCreditsDialog } from "./TransferCreditsDialog";
import { CreditTransactionHistory } from "./CreditTransactionHistory";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface BillingSubscriptionPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Local display-only plan catalog used by the Overview card.
 * Actual subscriptions are managed by Clerk Billing via <PricingTable /> —
 * this array is just for rendering "Your current plan" stats.
 *
 * Keys must match the Clerk plan slugs returned by useSubscription().
 */
const PLANS = [
  {
    key: "free",
    name: "Free",
    kind: "personal" as const,
    priceMonthly: 0,
    priceYearly: 0,
    priceLabel: "$0 / month",
    credits: 100,
    maxOrgs: 0,
    maxSeats: 1,
    features: ["100 credits/month", "1 project", "PDF export"],
  },
  {
    key: "pro_personal",
    name: "Pro",
    kind: "personal" as const,
    priceMonthly: 39.9,
    priceYearly: 32, // $384/yr
    priceLabel: "$39.90 / month",
    credits: 2500,
    maxOrgs: 1,
    maxSeats: 5,
    features: [
      "2,500 credits/month",
      "Unlimited projects",
      "1 organization, 5 seats",
      "10 GB storage",
      "Shared element library",
    ],
  },
  {
    key: "business",
    name: "Business",
    kind: "organization" as const,
    priceMonthly: 79,
    priceYearly: 63, // $756/yr
    priceLabel: "$79 / month",
    credits: 6900,
    maxOrgs: 3,
    maxSeats: 15,
    popular: true,
    features: [
      "Everything in Pro",
      "6,900 credits/month",
      "3 organizations",
      "15 seats per org",
      "20 GB storage",
    ],
  },
];


const statusColor: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  issued: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const typeColor: Record<string, string> = {
  payment: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  subscription: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
};

export default function BillingSubscriptionPage({ sidebarOpen, onToggleSidebar }: BillingSubscriptionPageProps) {
  const { user } = useUser();
  const { companyId } = useCompany();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  // pricingMode removed — all plans are now User Plans, no Personal/Org toggle needed
  // Plan is derived from the user's subscription (stable across org switches).
  const { plan: currentPlan } = useSubscription();
  const currentPlanMeta =
    PLANS.find((p) => p.key === currentPlan) ??
    PLANS.find((p) => p.key === "free")!;
  const [activeTab, setActiveTab] = useState<"overview" | "credits" | "plans" | "invoices">("overview");
  const creditPackages = getCreditPackages();

  const [invoiceType, setInvoiceType] = useState<"all" | "subscription" | "payment">("all");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<Id<"invoices"> | null>(null);

  // Credit purchase confirmation dialog state
  const [pendingPurchase, setPendingPurchase] = useState<{
    tokens: number;
    amount: number;
    price: string;
  } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Real credit data from Convex
  const creditBalance = useQuery(api.credits.getBalance, companyId ? { companyId } : "skip");
  const ledger = useQuery(api.credits.getLedger, companyId ? { companyId, limit: 50 } : "skip");

  // Real invoice data from Convex (same source as dashboard/invoices)
  const invoices = useQuery(
    api.invoices.userQueries.getUserInvoicesWithFilters,
    user?.id ? {
      companyId: user.id,
      invoiceType: invoiceType,
      limit: 100,
    } : "skip"
  );

  const invoiceStats = useQuery(
    api.invoices.userQueries.getUserInvoiceStats,
    user?.id ? { companyId: user.id } : "skip"
  );

  const selectedInvoice = useQuery(
    api.invoices.userQueries.getUserInvoiceDetail,
    selectedInvoiceId && user?.id ? {
      invoiceId: selectedInvoiceId,
      companyId: user.id,
    } : "skip"
  );

  // Calculate used credits (sum of negative entries = debits)
  const { totalUsed, totalAdded } = useMemo(() => {
    if (!ledger) return { totalUsed: 0, totalAdded: 0 };
    let used = 0;
    let added = 0;
    for (const entry of ledger) {
      if (entry.tokens < 0) {
        used += Math.abs(entry.tokens);
      } else {
        added += entry.tokens;
      }
    }
    return { totalUsed: Math.round(used), totalAdded: Math.round(added) };
  }, [ledger]);

  const handleBuyCredits = (tokens: number, amount: number, price: string) => {
    if (!user || !companyId) {
      alert("Please sign in to buy credits");
      return;
    }
    // Open the confirmation dialog. Actual checkout fires only after the
    // user explicitly agrees to the no-refund terms.
    setAgreedToTerms(false);
    setPendingPurchase({ tokens, amount, price });
  };

  const confirmPurchase = async () => {
    if (!pendingPurchase || !companyId || !agreedToTerms) return;
    setPurchaseLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",
          tokens: pendingPurchase.tokens,
          amount: pendingPurchase.amount,
          companyId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
        setPurchaseLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
      setPurchaseLoading(false);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "MYR") => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
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
            <OrgSwitcher
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
                            <h2 className="text-2xl lg:text-3xl font-bold text-white">{currentPlanMeta.name} Plan</h2>
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
                                {currentPlanMeta.credits.toLocaleString()}
                              </p>
                              <p className="text-sm text-(--text-secondary) uppercase tracking-wider">Plan Credits/Mo</p>
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
                                {currentPlanMeta.maxOrgs}
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
                                {currentPlanMeta.maxSeats}
                              </p>
                              <p className="text-sm text-(--text-secondary) uppercase tracking-wider">Seats per Org</p>
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
                          <p className="text-5xl font-bold text-white mb-2">{creditBalance !== undefined ? creditBalance.toLocaleString() : '...'}</p>
                          <p className="text-emerald-200 text-sm uppercase tracking-wider">Available Credits</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white mb-1">{totalUsed.toLocaleString()}</p>
                            <p className="text-xs text-emerald-200 uppercase tracking-wider">Used</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white mb-1">{totalAdded.toLocaleString()}</p>
                            <p className="text-xs text-emerald-200 uppercase tracking-wider">Purchased</p>
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
                  Purchase credits anytime for additional AI generations. Top-up credits valid 12 months from purchase.
                </p>
                <div className="mt-4 flex justify-center">
                  <TransferCreditsDialog defaultFromCompanyId={companyId ?? undefined} />
                </div>
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
                        <p className="text-emerald-400 text-sm">USD {(pkg.amountInCents / pkg.credits / 100).toFixed(2)}/credit</p>
                      </div>
                      
                      <button
                        onClick={() => handleBuyCredits(pkg.credits, pkg.amountInCents, pkg.price)}
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

              {/* Transaction History */}
              <div className="max-w-5xl mx-auto mt-10">
                <CreditTransactionHistory />
              </div>
            </div>
          )}

          {activeTab === "plans" && (
            <div className="space-y-8">
              {/* Plans Header */}
              <div className="text-center mb-10">
                <h2 className="text-2xl lg:text-3xl font-bold text-(--text-primary) mb-3 flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-teal-400" />
                  </div>
                  Choose Your Plan
                </h2>
                <p className="text-lg text-(--text-secondary) max-w-2xl mx-auto">
                  Select the perfect plan for your creative workflow
                </p>
              </div>

              {/* All plans are now User Plans — no Personal/Organization toggle.
                  Pro and Business unlock team features via the
                  ownerPlan snapshot propagation system. Subscribing is a
                  direct user action, no org required. */}

              {/* Clerk PricingTable */}
              <div className="storytica-clerk-pricing max-w-5xl mx-auto">
                <PricingTable
                  forOrganizations={false}
                  appearance={{
                    baseTheme: dark,
                    variables: {
                      colorPrimary: "#14b8a6",
                      colorBackground: "#1a1a1a",
                      fontFamily: "'Inter', sans-serif",
                      borderRadius: "0.75rem",
                    },
                  }}
                />
              </div>
              <style>{`
                .storytica-clerk-pricing .cl-pricingTableCard,
                .storytica-clerk-pricing [class*="pricingTableCard"]:not([class*="pricingTableCardFee"]):not([class*="pricingTableCardTitle"]):not([class*="pricingTableCardFeature"]) {
                  background-color: #1a1a1a !important;
                  border-color: #2a2a2a !important;
                  color: #fff !important;
                }
                .storytica-clerk-pricing button[class*="pricingTableCardCta"],
                .storytica-clerk-pricing .cl-button__pricingTableCardCta {
                  background-color: #0d9488 !important;
                  color: #fff !important;
                  border: none !important;
                  font-weight: 600 !important;
                }
                .storytica-clerk-pricing button[class*="pricingTableCardCta"]:hover {
                  background-color: #14b8a6 !important;
                }
                .storytica-clerk-pricing h2,
                .storytica-clerk-pricing h3,
                .storytica-clerk-pricing [class*="pricingTableCardTitle"] {
                  color: #fff !important;
                }
                .storytica-clerk-pricing [class*="pricingTableCardFee"] {
                  color: #fff !important;
                }
                .storytica-clerk-pricing [class*="pricingTableCardDescription"],
                .storytica-clerk-pricing [class*="pricingTableCardFeePeriod"] {
                  color: #888 !important;
                }
                .storytica-clerk-pricing [class*="pricingTableCardFeature"] {
                  color: #c0c0c0 !important;
                }
              `}</style>
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

              {/* Stats Overview — real invoice data */}
              {invoiceStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 max-w-6xl mx-auto">
                  {[
                    { label: "Total Invoices", value: String(invoiceStats.total), icon: FileText, color: "from-blue-500/20 to-blue-600/20", iconColor: "text-blue-400", borderColor: "border-blue-500/30" },
                    { label: "Total Amount", value: formatCurrency(invoiceStats.totalAmount), icon: DollarSign, color: "from-purple-500/20 to-purple-600/20", iconColor: "text-purple-400", borderColor: "border-purple-500/30" },
                    { label: "Paid", value: formatCurrency(invoiceStats.totalPaid), icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-600/20", iconColor: "text-emerald-400", borderColor: "border-emerald-500/30" },
                    { label: "Pending", value: formatCurrency(invoiceStats.totalPending), icon: Calendar, color: "from-yellow-500/20 to-yellow-600/20", iconColor: "text-yellow-400", borderColor: "border-yellow-500/30" },
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
              )}

              {/* Type Filter */}
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  {(["all", "subscription", "payment"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setInvoiceType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        invoiceType === type
                          ? "bg-(--accent-purple) text-white shadow-lg"
                          : "bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)"
                      }`}
                    >
                      {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice Table */}
              <div className="max-w-6xl mx-auto">
                <div className="bg-gradient-to-br from-(--bg-secondary) to-(--bg-tertiary) border border-(--border-primary) rounded-3xl overflow-hidden shadow-2xl">
                  {!invoices ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-(--text-secondary)" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <div className="text-center py-16">
                      <FileText className="h-12 w-12 text-(--text-tertiary) mx-auto mb-4" />
                      <p className="text-(--text-secondary) mb-2">No invoices found</p>
                      <p className="text-sm text-(--text-tertiary)">
                        Your invoices will appear here once you make a purchase
                      </p>
                    </div>
                  ) : (
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
                          {invoices.map((invoice: any, index: number) => (
                            <tr
                              key={invoice._id}
                              className={`border-b border-(--border-primary) last:border-0 hover:bg-(--bg-tertiary)/30 transition-all duration-200 ${
                                index % 2 === 0 ? "" : "bg-(--bg-primary)/20"
                              }`}
                            >
                              <td className="px-6 py-4 text-sm font-mono text-white font-semibold">
                                {invoice.invoiceNo}
                              </td>
                              <td className="px-6 py-4 text-sm text-(--text-secondary)">
                                {formatDate(invoice.issuedAt || invoice.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  typeColor[invoice.invoiceType] || "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                }`}>
                                  {invoice.invoiceType === "subscription" ? "Subscription" : "Payment"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-white">
                                {invoice.items?.[0]?.description || "N/A"}
                                {invoice.items?.length > 1 && (
                                  <span className="text-xs text-(--text-tertiary) ml-1">
                                    +{invoice.items.length - 1} more
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-white">
                                {formatCurrency(invoice.total, invoice.currency)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  statusColor[invoice.status] || "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                }`}>
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => setSelectedInvoiceId(invoice._id)}
                                  className="text-xs text-(--accent-purple) hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Detail Modal */}
              {selectedInvoiceId && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoiceId(null)}>
                  <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-3xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="p-8">
                      {/* Modal Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{selectedInvoice.invoiceNo}</h3>
                          <p className="text-sm text-(--text-secondary) mt-1">
                            Issued: {formatDate(selectedInvoice.issuedAt || selectedInvoice.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColor[selectedInvoice.status] || ""}`}>
                            {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                          </span>
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${typeColor[selectedInvoice.invoiceType] || ""}`}>
                            {selectedInvoice.invoiceType === "subscription" ? "Subscription" : "Payment"}
                          </span>
                        </div>
                      </div>

                      {/* Billing Details */}
                      <div className="border-t border-(--border-primary) pt-6 mb-6">
                        <h4 className="font-semibold text-white mb-3">Billing Information</h4>
                        <div className="text-sm text-(--text-secondary)">
                          <p className="font-medium text-white">{selectedInvoice.billingDetails?.name}</p>
                          <p>{selectedInvoice.billingDetails?.email}</p>
                          {selectedInvoice.billingDetails?.address && (
                            <p className="mt-1">{selectedInvoice.billingDetails.address}</p>
                          )}
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="border-t border-(--border-primary) pt-6 mb-6">
                        <h4 className="font-semibold text-white mb-3">Items</h4>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-(--border-primary)">
                              <th className="text-left py-2 text-xs font-semibold text-(--text-secondary) uppercase">Description</th>
                              <th className="text-center py-2 text-xs font-semibold text-(--text-secondary) uppercase">Qty</th>
                              <th className="text-right py-2 text-xs font-semibold text-(--text-secondary) uppercase">Unit Price</th>
                              <th className="text-right py-2 text-xs font-semibold text-(--text-secondary) uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items?.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-(--border-primary)/50">
                                <td className="py-3 text-sm text-white">{item.description}</td>
                                <td className="py-3 text-sm text-(--text-secondary) text-center">{item.quantity}</td>
                                <td className="py-3 text-sm text-(--text-secondary) text-right">
                                  {formatCurrency(item.unitPrice, selectedInvoice.currency)}
                                </td>
                                <td className="py-3 text-sm font-semibold text-white text-right">
                                  {formatCurrency(item.total, selectedInvoice.currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="border-t border-(--border-primary) pt-6 mb-6">
                        <div className="space-y-2 max-w-xs ml-auto">
                          <div className="flex justify-between text-sm">
                            <span className="text-(--text-secondary)">Subtotal:</span>
                            <span className="font-medium text-white">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                          </div>
                          {selectedInvoice.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-(--text-secondary)">Tax{selectedInvoice.taxRate ? ` (${selectedInvoice.taxRate}%)` : ""}:</span>
                              <span className="font-medium text-white">{formatCurrency(selectedInvoice.tax, selectedInvoice.currency)}</span>
                            </div>
                          )}
                          {selectedInvoice.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-(--text-secondary)">Discount:</span>
                              <span className="font-medium text-emerald-400">-{formatCurrency(selectedInvoice.discount, selectedInvoice.currency)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t border-(--border-primary) pt-2">
                            <span className="text-white">Total:</span>
                            <span className="text-white">{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedInvoice.notes && (
                        <div className="border-t border-(--border-primary) pt-6 mb-6">
                          <h4 className="font-semibold text-white mb-2">Notes</h4>
                          <p className="text-sm text-(--text-secondary)">{selectedInvoice.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-(--border-primary) pt-6 flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedInvoiceId(null)}
                          className="px-6 py-3 rounded-xl border border-(--border-primary) text-(--text-secondary) hover:text-white hover:bg-(--bg-tertiary) transition-all duration-200 font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Credit purchase confirmation dialog — enforces explicit
          agreement to the no-refund/no-cancel policy before opening
          Stripe Checkout. The agreement also serves as evidence in
          chargeback disputes. See docs/billing-policy.md §3.4. */}
      <Dialog
        open={!!pendingPurchase}
        onOpenChange={(open) => {
          if (!open && !purchaseLoading) {
            setPendingPurchase(null);
            setAgreedToTerms(false);
          }
        }}
      >
        <DialogContent className="max-w-lg !bg-(--bg-primary) text-(--text-primary) border-(--border-primary)">
          <DialogHeader>
            <DialogTitle className="text-(--text-primary)">Confirm credit purchase</DialogTitle>
            <DialogDescription className="text-(--text-secondary)">
              Review the terms below before continuing to payment.
            </DialogDescription>
          </DialogHeader>

          {pendingPurchase && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{pendingPurchase.tokens.toLocaleString()} credits</div>
                    <div className="text-sm text-(--text-secondary)">One-time purchase</div>
                  </div>
                  <div className="text-2xl font-bold">{pendingPurchase.price}</div>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-(--text-secondary)">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span>Credits are added to your <strong>personal workspace</strong> immediately on payment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                  <span>Credits <strong>never expire</strong> and are not affected by subscription changes.</span>
                </li>
                <li className="flex items-start gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span><strong>Final sale:</strong> credit top-up purchases are non-refundable and cannot be cancelled once payment completes.</span>
                </li>
                <li className="flex items-start gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Credits cannot be converted back to cash, transferred between users, or sold.</span>
                </li>
              </ul>

              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3 hover:bg-(--bg-tertiary) transition-colors">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  I understand that this purchase is <strong>final</strong> and cannot be refunded or cancelled. I agree to the{" "}
                  <a href="/billing-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">billing policy</a>.
                </span>
              </label>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setPendingPurchase(null);
                setAgreedToTerms(false);
              }}
              disabled={purchaseLoading}
              className="px-4 py-2 rounded-lg border border-(--border-primary) hover:bg-(--bg-secondary) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmPurchase}
              disabled={!agreedToTerms || purchaseLoading}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {purchaseLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
);
}

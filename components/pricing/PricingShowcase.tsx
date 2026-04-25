"use client";

import { Fragment, useState } from "react";
import {
  Check, X, Sparkles, Zap, Crown, Building2, ChevronRight,
  Film, Image, Music, Palette, Camera, SlidersHorizontal,
  Layers, Video, Type, FileText, Download, Users, HardDrive,
  Shield, ArrowRight, Star, Gem, Info,
} from "lucide-react";
import { SignedIn } from "@clerk/nextjs";
import CreditTopUpCards from "@/components/pricing/CreditTopUpCards";
// @ts-ignore -- moduleResolution mismatch; works at runtime with Next.js bundler
import { CheckoutButton, SubscriptionDetailsButton, usePlans } from "@clerk/nextjs/experimental";
import { CLERK_PLAN_SLUGS } from "@/lib/plan-config";

// ── Plan data ────────────────────────────────────────────────────────────────

const GENERATION_ESTIMATES = {
  free: {
    credits: 50,
    images: { model: "GPT Image 2", count: 12, cost: 4 },
    videosFast: { model: "Seedance 2.0 Fast", count: 1, cost: 29, detail: "480P 5s" },
    videos: { model: "Seedance 1.5 Pro", count: 10, cost: 5, detail: "480P 4s" },
  },
  pro: {
    credits: 3500,
    images: { model: "GPT Image 2", count: 875, cost: 4 },
    videosFast: { model: "Seedance 2.0 Fast", count: 120, cost: 29, detail: "480P 5s" },
    videos: { model: "Seedance 1.5 Pro", count: 700, cost: 5, detail: "480P 4s" },
  },
  business: {
    credits: 8000,
    images: { model: "GPT Image 2", count: 2000, cost: 4 },
    videosFast: { model: "Seedance 2.0 Fast", count: 275, cost: 29, detail: "480P 5s" },
    videos: { model: "Seedance 1.5 Pro", count: 1600, cost: 5, detail: "480P 4s" },
  },
};

export interface PricingShowcaseProps {
  currentPlan?: string;
  onSelectPlan?: (plan: string) => void;
  /** When false, hides Buy Credits section (guest users can't purchase) */
  isLoggedIn?: boolean;
  /** When true, hides WhyStorytica + FeatureComparison (use them standalone on landing) */
  compact?: boolean;
}

// Map our internal plan keys to Clerk plan slugs for CheckoutButton
const PLAN_CLERK_SLUGS: Record<string, string> = {
  pro: CLERK_PLAN_SLUGS.pro_personal,
  business: CLERK_PLAN_SLUGS.business,
};

export default function PricingShowcase({
  currentPlan,
  onSelectPlan,
  isLoggedIn = false,
  compact = false,
}: PricingShowcaseProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  // Fetch actual Clerk plan objects to get planId for CheckoutButton
  const { data: clerkPlans } = usePlans();
  const getPlanId = (internalId: string): string | undefined => {
    const slug = PLAN_CLERK_SLUGS[internalId];
    if (!slug || !clerkPlans) return undefined;
    const found = clerkPlans.find((p: any) => p.slug === slug);
    return found?.id;
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      tagline: "For hobbyists & first-time creators",
      badge: null,
      cardStyle: "border-[#2a2a2a] bg-[#111111]",
      headerGradient: "",
      monthly: 0,
      annual: 0,
      originalMonthly: 0,
      savings: 0,
      credits: 100,
      gens: GENERATION_ESTIMATES.free,
      cta: "Start Free",
      ctaStyle: "bg-[#2a2a2a] text-white hover:bg-[#333] border border-[#3a3a3a]",
      features: [
        { text: "3 projects (20 frames each)", included: true },
        { text: "300 MB storage", included: true },
        { text: "All 25+ AI models", included: true },
        { text: "AI Analyze + Prompt Enhance", included: true },
        { text: "Face swap + AI inpaint + edit image", included: true },
        { text: "Drawing canvas + bubble text", included: true },
        { text: "Annotations + stickers", included: true },
        { text: "Element manager", included: true },
        { text: "Script-to-storyboard + PDF export", included: true },
        { text: "Camera Studio + Motion presets", included: false },
        { text: "3D Angle + Speed Ramp + Palette", included: false },
        { text: "Video editor (multi-track)", included: false },
        { text: "Music AI + Cover Song + Personas", included: false },
        { text: "Director's View + Compare frames", included: false },
        { text: "Batch generation + Presets", included: false },
        { text: "Video export (MP4)", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "For serious creators & small teams",
      badge: "MOST POPULAR",
      cardStyle: "border-teal-500/60 bg-gradient-to-b from-teal-950/40 to-[#111111]",
      headerGradient: "from-teal-500 to-emerald-500",
      monthly: 45,
      annual: 39.9,
      originalMonthly: 45,
      savings: 61,
      credits: 3500,
      gens: GENERATION_ESTIMATES.pro,
      cta: "Get Pro",
      ctaStyle: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-500/25",
      features: [
        { text: "Unlimited projects & frames", included: true },
        { text: "10 GB storage", included: true },
        { text: "5 seats, 1 organization", included: true },
        { text: "Camera Studio + Motion presets", included: true },
        { text: "3D Angle + Speed Ramp + Palette", included: true },
        { text: "Video editor (multi-track timeline)", included: true },
        { text: "Video export (MP4)", included: true },
        { text: "Subtitle track + blend modes", included: true },
        { text: "Music AI + Cover Song + Personas", included: true },
        { text: "Director's View + Compare frames", included: true },
        { text: "Batch generation + Presets system", included: true },
      ],
    },
    {
      id: "business",
      name: "Business",
      tagline: "For agencies & production studios",
      badge: "BEST VALUE",
      cardStyle: "border-purple-500/50 bg-gradient-to-b from-purple-950/30 to-[#111111]",
      headerGradient: "from-purple-500 to-pink-500",
      monthly: 119,
      annual: 89.9,
      originalMonthly: 119,
      savings: 349,
      credits: 8000,
      gens: GENERATION_ESTIMATES.business,
      cta: "Get Business",
      ctaStyle: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg shadow-purple-500/25",
      features: [
        { text: "Everything in Pro", included: true, highlight: true },
        { text: "20 GB storage", included: true },
        { text: "15 seats per org", included: true },
        { text: "3 organizations", included: true },
        { text: "Shared credit pool", included: true },
        { text: "Team analytics", included: true },
        { text: "Priority support", included: true },
        { text: "Custom element libraries", included: true },
      ],
    },
  ];

  const isActive = (planId: string) => {
    if (!currentPlan) return false;
    if (planId === "pro" && (currentPlan === "pro_personal" || currentPlan === "pro")) return true;
    return currentPlan === planId;
  };

  return (
    <div className="w-full">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Images from $0.04 · Videos from $0.05
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          The all-in-one AI storyboard studio — script to export in one app
        </p>
      </div>

      {/* ── Billing Toggle ─────────────────────────────────────────── */}
      <div className="flex justify-center mb-10">
        <div className="relative inline-flex items-center rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              billing === "monthly"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billing === "annual"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Annual
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
        {plans.map((plan) => {
          const price = billing === "annual" ? plan.annual : plan.monthly;
          const active = isActive(plan.id);

          return (
            <div key={plan.id} className="relative flex flex-col">
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-white shadow-lg ${
                      plan.badge === "MOST POPULAR"
                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 shadow-teal-500/30"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Active badge */}
              {active && (
                <div className="absolute -top-3.5 right-4 z-10">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg">
                    Active
                  </span>
                </div>
              )}

              {/* Card */}
              <div
                className={`flex-1 flex flex-col rounded-2xl border-2 p-6 transition-all duration-300 hover:translate-y-[-2px] ${plan.cardStyle} ${
                  active ? "ring-2 ring-emerald-500/50" : ""
                }`}
              >
                {/* Plan name + tagline */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {plan.monthly === 0 ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">$0</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Always free</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        {billing === "annual" && (
                          <span className="text-xl text-gray-500 line-through font-medium">
                            ${plan.originalMonthly}
                          </span>
                        )}
                        <span className="text-4xl font-bold text-white">
                          ${price.toFixed(price % 1 === 0 ? 0 : 2)}
                        </span>
                        <span className="text-gray-400 text-sm">/month</span>
                      </div>
                      {billing === "annual" && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500">Billed annually</span>
                          <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 text-xs font-bold border border-yellow-400/20">
                            Save ${plan.savings}/yr
                          </span>
                        </div>
                      )}
                      {billing === "monthly" && (
                        <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
                      )}
                    </>
                  )}
                </div>

                {/* Generation Estimates Box */}
                <div className="rounded-xl bg-[#0a0a0a] border border-[#222] p-4 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-white">
                      {plan.gens.credits.toLocaleString()} credits/month
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-blue-400" />
                        {plan.gens.images.model}
                      </span>
                      <span className="text-white font-semibold">
                        ~{plan.gens.images.count.toLocaleString()} images
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-purple-400" />
                        {plan.gens.videosFast.model}
                      </span>
                      <span className="text-white font-semibold">
                        ~{plan.gens.videosFast.count.toLocaleString()} videos
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-emerald-400" />
                        {plan.gens.videos.model}
                      </span>
                      <span className="text-white font-semibold">
                        ~{plan.gens.videos.count.toLocaleString()} videos
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#222]">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        Top-up credits never expire
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <PlanCTAButton
                  plan={plan}
                  active={active}
                  currentPlan={currentPlan}
                  clerkPlanId={getPlanId(plan.id)}
                  billingPeriod={billing === "annual" ? "annual" : "month"}
                  onFallback={() => onSelectPlan?.(plan.id)}
                />

                {/* Features */}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {plan.id === "free"
                      ? "What's included"
                      : plan.id === "pro"
                        ? "Everything in Free, plus"
                        : "Everything in Pro, plus"}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {f.included ? (
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                            (f as any).highlight ? "text-purple-400" : "text-emerald-400"
                          }`} />
                        ) : (
                          <X className="w-4 h-4 mt-0.5 shrink-0 text-gray-600" />
                        )}
                        <span
                          className={`text-sm ${
                            f.included ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Credit Top-Up (only for logged-in users) ───────────────── */}
      {isLoggedIn && (
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <Gem className="w-5 h-5 text-emerald-400" />
              Need More Credits?
            </h3>
            <p className="text-sm text-gray-400">
              No subscription required. Buy credits anytime — they never expire.
            </p>
          </div>
          <CreditTopUpCards />
        </div>
      )}

      {/* ── Why Storytica + Feature Comparison (unless compact) ───── */}
      {!compact && (
        <>
          <WhyStorytica />
          <div className="max-w-5xl mx-auto mb-10">
            <FeatureComparisonTable />
          </div>
        </>
      )}

    </div>
  );
}

// ── Plan CTA Button ─────────────────────────────────────────────────────────

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
  pro_personal: 1,
  business: 2,
};

interface PlanCTAButtonProps {
  plan: {
    id: string;
    cta: string;
    ctaStyle: string;
  };
  active: boolean;
  currentPlan?: string;
  clerkPlanId?: string;
  billingPeriod: string;
  onFallback?: () => void;
}

function PlanCTAButton({ plan, active, currentPlan, clerkPlanId, billingPeriod, onFallback }: PlanCTAButtonProps) {
  const btnClass = `w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 mb-6`;
  const currentRank = PLAN_RANK[currentPlan ?? "free"] ?? 0;
  const targetRank = PLAN_RANK[plan.id] ?? 0;
  const isUpgrade = targetRank > currentRank;
  const isDowngrade = targetRank < currentRank;

  // Active plan -> "Manage Subscription" via Clerk's SubscriptionDetailsButton
  if (active) {
    return (
      <SignedIn>
        <SubscriptionDetailsButton>
          <button className={`${btnClass} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30`}>
            Manage Subscription
          </button>
        </SubscriptionDetailsButton>
      </SignedIn>
    );
  }

  // Downgrade to Free -> cancel subscription via SubscriptionDetailsButton
  if (plan.id === "free" && isDowngrade) {
    return (
      <SignedIn>
        <SubscriptionDetailsButton>
          <button className={`${btnClass} bg-[#2a2a2a] text-gray-300 hover:bg-[#333] border border-[#3a3a3a]`}>
            Downgrade to Free
          </button>
        </SubscriptionDetailsButton>
      </SignedIn>
    );
  }

  // Free plan, user is already free -> no action
  if (plan.id === "free" && !isDowngrade) {
    return (
      <button
        disabled
        className={`${btnClass} bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] cursor-default`}
      >
        Current Plan
      </button>
    );
  }

  // Paid plans -> use Clerk CheckoutButton (works for both upgrade and downgrade)
  if (clerkPlanId) {
    const label = isUpgrade
      ? `Upgrade to ${plan.id === "pro" ? "Pro" : "Business"}`
      : `Downgrade to ${plan.id === "pro" ? "Pro" : "Business"}`;

    return (
      <SignedIn>
        <CheckoutButton
          planId={clerkPlanId}
          planPeriod={billingPeriod as any}
          onSubscriptionComplete={() => window.location.reload()}
        >
          <button className={`${btnClass} ${plan.ctaStyle}`}>
            {label}
          </button>
        </CheckoutButton>
      </SignedIn>
    );
  }

  // Fallback (plans still loading or user not signed in)
  return (
    <button
      onClick={onFallback}
      className={`${btnClass} ${plan.ctaStyle}`}
    >
      {plan.cta}
    </button>
  );
}

// ── Why Storytica (exported for landing page) ───────────────────────────────

export function WhyStorytica() {
  return (
    <div className="max-w-5xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          What makes Storytica different
        </h3>
        <p className="text-gray-400 text-sm">
          Built for storyboarding. Not just another AI image generator.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "No per-seat charges", desc: "Pro includes 5 seats. Business includes 15. One plan covers your whole team — competitors charge per seat." },
          { icon: Building2, title: "One plan, multiple orgs", desc: "Business plan supports 3 organizations. No separate billing per org — manage all clients from one subscription." },
          { icon: Shield, title: "Credits never expire", desc: "Purchased top-up credits last forever. Every competitor resets monthly or expires in 90 days." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5 hover:translate-y-[-1px] transition-all">
            <item.icon className="w-5 h-5 text-gray-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1.5">{item.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}

        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5 hover:translate-y-[-1px] transition-all">
          <Palette className="w-5 h-5 text-gray-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1.5">25+ AI models, you choose</h4>
          <p className="text-xs text-gray-500 leading-relaxed">Pick cheap fast drafts or premium quality — not locked to one model. Image, video, music, audio, analyze.</p>
        </div>

        <div className="rounded-xl border border-teal-500/30 bg-gradient-to-b from-teal-950/20 to-[#111] p-6 hover:translate-y-[-1px] transition-all flex flex-col items-center text-center">
          <Film className="w-7 h-7 text-teal-400 mb-3" />
          <h4 className="text-base font-bold text-white mb-2">Storyboard-first platform</h4>
          <p className="text-xs text-gray-400 leading-relaxed">Script to storyboard to video editor to export — the only all-in-one pipeline built for visual storytelling.</p>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5 hover:translate-y-[-1px] transition-all">
          <Camera className="w-5 h-5 text-gray-400 mb-3" />
          <h4 className="text-sm font-semibold text-white mb-1.5">Pro creative tools</h4>
          <p className="text-xs text-gray-500 leading-relaxed">3D camera angles, motion presets, speed ramps, color palettes, face swap, inpaint sections — not just generate & download.</p>
        </div>

        {[
          { icon: Layers, title: "Canvas + annotations", desc: "Draw, add bubble text, stickers, annotations directly on frames. Full canvas editor with AI inpainting built in." },
          { icon: Zap, title: "Real-time collaboration", desc: "Every change syncs instantly across your team. Frames, prompts, generations, edits — all live. No refresh, no polling." },
          { icon: Star, title: "Transparent pricing", desc: "See exact credit cost before every generation. No hidden fees, no bait-and-switch, no unlimited plans that aren't." },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-[#2a2a2a] bg-[#111] p-5 hover:translate-y-[-1px] transition-all">
            <item.icon className="w-5 h-5 text-gray-400 mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1.5">{item.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature Comparison Table (exported for landing page) ────────────────────

export function FeatureComparisonTable() {
  const [expanded, setExpanded] = useState(false);

  const categories = [
    {
      name: "AI Generation (all plans)",
      features: [
        { name: "AI image generation (25+ models)", free: true, pro: true, biz: true },
        { name: "AI video generation", free: true, pro: true, biz: true },
        { name: "Face swap", free: true, pro: true, biz: true },
        { name: "AI Analyze (image/video/audio)", free: true, pro: true, biz: true },
        { name: "Prompt Enhance", free: true, pro: true, biz: true },
        { name: "Text-to-speech (ElevenLabs)", free: true, pro: true, biz: true },
      ],
    },
    {
      name: "Canvas & Editing (all plans)",
      features: [
        { name: "Drawing canvas + shapes", free: true, pro: true, biz: true },
        { name: "Bubble text + annotations + stickers", free: true, pro: true, biz: true },
        { name: "AI inpaint (edit image sections)", free: true, pro: true, biz: true },
        { name: "Edit image (AI-powered)", free: true, pro: true, biz: true },
        { name: "Element manager + shared library", free: true, pro: true, biz: true },
        { name: "Script-to-storyboard", free: true, pro: true, biz: true },
        { name: "PDF export", free: true, pro: true, biz: true },
      ],
    },
    {
      name: "Camera & Motion (Pro+)",
      features: [
        { name: "Camera Studio (virtual lenses)", free: false, pro: true, biz: true },
        { name: "3D Camera Angle Picker", free: false, pro: true, biz: true },
        { name: "Motion camera presets (15+)", free: false, pro: true, biz: true },
        { name: "Speed Ramp Editor", free: false, pro: true, biz: true },
        { name: "Color Palette Picker", free: false, pro: true, biz: true },
      ],
    },
    {
      name: "Production Tools (Pro+)",
      features: [
        { name: "Director's View filmstrip", free: false, pro: true, biz: true },
        { name: "Compare frames side-by-side", free: false, pro: true, biz: true },
        { name: "Batch frame generation", free: false, pro: true, biz: true },
        { name: "Presets system (save & reuse)", free: false, pro: true, biz: true },
        { name: "Music AI + Cover Song + Personas", free: false, pro: true, biz: true },
      ],
    },
    {
      name: "Video Editor & Export (Pro+)",
      features: [
        { name: "Video editor (multi-track timeline)", free: false, pro: true, biz: true },
        { name: "Subtitle track + blend modes", free: false, pro: true, biz: true },
        { name: "Video export (MP4)", free: false, pro: true, biz: true },
      ],
    },
    {
      name: "Limits & Team",
      features: [
        { name: "Projects", free: "3", pro: "Unlimited", biz: "Unlimited" },
        { name: "Frames per project", free: "20", pro: "Unlimited", biz: "Unlimited" },
        { name: "Storage", free: "300 MB", pro: "10 GB", biz: "20 GB" },
        { name: "Credits/month", free: "100", pro: "3,500", biz: "8,000" },
        { name: "Seats (no per-seat charge)", free: "1", pro: "5 included", biz: "15 included" },
        { name: "Organizations (one plan)", free: false, pro: "1", biz: "3" },
        { name: "Shared credit pool", free: false, pro: false, biz: true },
        { name: "Priority support", free: false, pro: false, biz: true },
      ],
    },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (value === false) return <X className="w-4 h-4 text-gray-600 mx-auto" />;
    return <span className="text-xs text-gray-300 font-medium">{value}</span>;
  };

  const visibleCategories = expanded ? categories : categories.slice(0, 2);

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#111] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#151515] transition-colors"
      >
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" />
          Full Feature Comparison
        </h3>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-[#222]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[40%]">
                  Feature
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Free
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Pro
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  Business
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((cat) => (
                <Fragment key={cat.name}>
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-[#0a0a0a] border-t border-[#1a1a1a]"
                    >
                      {cat.name}
                    </td>
                  </tr>
                  {cat.features.map((f) => (
                    <tr
                      key={f.name}
                      className="border-t border-[#1a1a1a] hover:bg-[#151515] transition-colors"
                    >
                      <td className="px-5 py-2.5 text-sm text-gray-300">{f.name}</td>
                      <td className="px-4 py-2.5 text-center">{renderCell(f.free)}</td>
                      <td className="px-4 py-2.5 text-center">{renderCell(f.pro)}</td>
                      <td className="px-4 py-2.5 text-center">{renderCell(f.biz)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

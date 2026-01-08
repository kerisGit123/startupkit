# Extract Reusable SaaS Core from Convex-based Implementation

**Last Updated:** January 8, 2026  
**Project:** Multi-tenant SaaS with Convex + Next.js 15 + Clerk + Stripe

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Convex Multi-Tenant Architecture](#convex-multi-tenant-architecture)
3. [Critical Path Code Snippets](#critical-path-code-snippets)
4. [React Hooks & Providers](#react-hooks--providers)
5. [N8N Integration Patterns](#n8n-integration-patterns)
6. [Essential Configuration Files](#essential-configuration-files)
7. [Deployment & Setup Guide](#deployment--setup-guide)

---

## Architecture Overview

### Tech Stack
- **Database/Backend:** Convex (queries, mutations, actions)
- **Frontend:** Next.js 15 (App Router) + React 19
- **UI Framework:** Shadcn UI + Tailwind CSS
- **Authentication:** Clerk (with Organizations support)
- **Payments:** Stripe (subscriptions + one-time payments)
- **Automation:** N8N workflows (OCR, webhooks)
- **Feature Gating:** Schematic (optional)

### Multi-Tenant Model
- **Tenant ID:** `companyId` (either Clerk `org_xxx` or `user_xxx`)
- **Isolation:** Row-level via `companyId` field in all tables
- **Context Resolution:** `useCompany()` hook derives tenant from Clerk

---

## Convex Multi-Tenant Architecture

### 1. Core Schema Design

#### **Tenant Resolution Pattern**

```typescript
// convex/schema.ts - PORTABLE CORE TABLES

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // CORE: User Management
  // ============================================
  users: defineTable({
    clerkUserId: v.optional(v.string()), // Clerk user ID
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    deletionTime: v.optional(v.number()), // Soft delete
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_email", ["email"]),

  // ============================================
  // CORE: Organization Settings (Tenant Config)
  // ============================================
  org_settings: defineTable({
    companyId: v.string(), // TENANT ISOLATION KEY (org_xxx or user_xxx)
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
    contactNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    companyLogoId: v.optional(v.id("_storage")),
    aiEnabled: v.optional(v.boolean()),
    // CONFIGURATION POINT: Add custom tenant settings here
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CORE: Subscription Management
  // ============================================
  org_subscriptions: defineTable({
    companyId: v.string(), // TENANT ISOLATION KEY
    plan: v.string(), // "free" | "starter" | "pro" | "business"
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()), // Unix timestamp
    status: v.optional(v.string()), // active, trialing, canceled, etc.
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_companyId", ["companyId"])
    .index("by_subscription", ["stripeSubscriptionId"]),

  // ============================================
  // CORE: Subscription Audit Log
  // ============================================
  subscription_transactions: defineTable({
    companyId: v.string(),
    action: v.string(), // created | updated | deleted | checkout_completed
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    source: v.optional(v.string()), // clerk | stripe
    eventType: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CORE: Credits System (One-time Purchases)
  // ============================================
  credits_ledger: defineTable({
    companyId: v.string(),
    tokens: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    amountPaid: v.optional(v.number()), // Smallest currency unit (cents)
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  credits_balance: defineTable({
    companyId: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  }).index("by_companyId", ["companyId"]),

  // ============================================
  // CONFIGURATION POINT: Add your business tables here
  // All tables MUST include companyId for tenant isolation
  // ============================================
});
```

#### **Key Patterns:**
1. **Every table has `companyId`** for tenant isolation
2. **Indexes on `companyId`** for fast tenant-scoped queries
3. **Soft deletes** via `deletionTime` field
4. **Audit trails** for subscription changes

---

### 2. Authentication & Tenant Resolution

#### **Convex Auth Config**

```typescript
// convex/auth.config.ts

const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
```

#### **User Sync from Clerk**

```typescript
// convex/users.ts - Clerk Webhook Handler

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const fields = {
      clerkUserId: args.clerkUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      fullName: args.fullName,
      imageUrl: args.imageUrl,
      username: args.username,
      updatedAt: now,
      deletionTime: undefined as number | undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    const id = await ctx.db.insert("users", {
      ...fields,
      createdAt: now,
    });
    return id;
  },
});

export const deleteFromClerk = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!existing) return null;

    // Soft delete
    await ctx.db.patch(existing._id, { deletionTime: now, updatedAt: now });
    return existing._id;
  },
});
```

---

### 3. Subscription Management

#### **Subscription Queries & Mutations**

```typescript
// convex/subscriptions.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSubscription = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const sub = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    return sub ?? null;
  },
});

export const upsertSubscription = mutation({
  args: {
    companyId: v.string(),
    plan: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        currentPeriodEnd: args.currentPeriodEnd,
        status: args.status,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("org_subscriptions", {
        companyId: args.companyId,
        plan: args.plan,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        currentPeriodEnd: args.currentPeriodEnd,
        status: args.status,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Feature Entitlements based on Plan
export const getEntitlements = query({
  args: { companyId: v.string() },
  handler: async (ctx, { companyId }) => {
    const sub = await ctx.db
      .query("org_subscriptions")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .first();
    
    const plan = sub?.plan || "free";
    
    // CONFIGURATION POINT: Define your plan features
    const defaults = {
      free: { 
        scansPerMonth: 5, 
        storageMB: 10, 
        features: ["5 Scans per month"] 
      },
      starter: { 
        scansPerMonth: 50, 
        storageMB: 100, 
        features: ["50 Scans per month", "Organization"] 
      },
      pro: { 
        scansPerMonth: 200, 
        storageMB: 300, 
        features: ["200 Scans per month", "AI Summary", "Organization"] 
      },
    } as const;
    
    // Environment variable overrides
    const freeOverride = Number(process.env.FREE_STORAGE_MB);
    const starterOverride = Number(process.env.STARTER_STORAGE_MB);
    const proOverride = Number(process.env.PRO_STORAGE_MB);
    
    const withOverrides: Record<string, any> = {
      free: { 
        ...defaults.free, 
        storageMB: Number.isFinite(freeOverride) ? freeOverride : defaults.free.storageMB 
      },
      starter: { 
        ...defaults.starter, 
        storageMB: Number.isFinite(starterOverride) ? starterOverride : defaults.starter.storageMB 
      },
      pro: { 
        ...defaults.pro, 
        storageMB: Number.isFinite(proOverride) ? proOverride : defaults.pro.storageMB 
      },
    };
    
    const e = withOverrides[(plan as string).toLowerCase()] || withOverrides.free;
    return { plan, ...e };
  },
});

export const recordTransaction = mutation({
  args: {
    companyId: v.string(),
    action: v.string(),
    plan: v.optional(v.string()),
    status: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    source: v.optional(v.string()),
    eventType: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // De-duplicate within 60-second window
    const windowMs = 60_000;
    const recent: any[] = [];
    const cursor = ctx.db
      .query("subscription_transactions")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .order("desc");
    
    for await (const doc of cursor) {
      if (doc.createdAt && now - doc.createdAt > windowMs) break;
      recent.push(doc);
      if (recent.length >= 50) break;
    }
    
    const isDup = recent.some((d) =>
      d.action === args.action &&
      (d.plan || null) === (args.plan || null) &&
      (d.status || null) === (args.status || null) &&
      (d.stripeCustomerId || null) === (args.stripeCustomerId || null) &&
      (d.stripeSubscriptionId || null) === (args.stripeSubscriptionId || null) &&
      (d.source || null) === (args.source || null) &&
      (d.eventType || null) === (args.eventType || null)
    );
    
    if (isDup) return true;
    
    await ctx.db.insert("subscription_transactions", {
      companyId: args.companyId,
      action: args.action,
      plan: args.plan,
      status: args.status,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      source: args.source,
      eventType: args.eventType,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: now,
    });
    return true;
  },
});
```

---

## Critical Path Code Snippets

### A. Tenant Creation Flow

**Flow:** User signs up → Clerk webhook → Create user → Ensure settings → Create Stripe customer

#### **1. Clerk Webhook Handler**

```typescript
// app/api/clerk/webhook/route.ts

import { NextResponse } from "next/server";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!secret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("Clerk webhook verification failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const body = typeof evt === "string" ? JSON.parse(evt) : evt;
    const type: string = body?.type || "";
    const data = body?.data || {};

    // Handle user creation/update
    if (type === "user.created" || type === "user.updated") {
      const u: any = data;
      const email = u?.email_addresses?.[0]?.email_address || u?.email;
      const firstName = u?.first_name || u?.firstName;
      const lastName = u?.last_name || u?.lastName;
      const fullName = u?.full_name || [firstName, lastName].filter(Boolean).join(" ");
      const imageUrl = u?.image_url || u?.imageUrl;
      const username = u?.username;

      // Upsert user in Convex
      await convex.mutation(api.users.upsertFromClerk, {
        clerkUserId: u?.id,
        email,
        firstName,
        lastName,
        fullName,
        imageUrl,
        username,
      });

      // Ensure settings row for personal account
      await convex.mutation(api.settings.ensureOrgSettings, {
        companyId: u?.id,
        subjectType: "user",
        aiEnabled: true,
        updatedBy: u?.id || "system",
      });

      return NextResponse.json({ ok: true });
    }

    if (type === "user.deleted") {
      const clerkUserId = data?.id;
      if (clerkUserId) {
        await convex.mutation(api.users.deleteFromClerk, { clerkUserId });
      }
      return NextResponse.json({ ok: true });
    }

    // Handle subscription events (see Subscription Syncing section)
    // ...

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Clerk webhook handler error", e?.message);
    return NextResponse.json({ error: "Unhandled webhook" }, { status: 500 });
  }
}
```

#### **2. Settings Mutation (Auto-create tenant config)**

```typescript
// convex/settings.ts

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ensureOrgSettings = mutation({
  args: {
    companyId: v.string(),
    subjectType: v.union(v.literal("organization"), v.literal("user")),
    aiEnabled: v.boolean(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("org_settings")
      .withIndex("by_companyId", (q) => q.eq("companyId", args.companyId))
      .first();

    const now = Date.now();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("org_settings", {
      companyId: args.companyId,
      subjectType: args.subjectType,
      aiEnabled: args.aiEnabled,
      updatedAt: now,
      updatedBy: args.updatedBy,
      createdAt: now,
    });
  },
});
```

---

### B. Subscription Syncing (Stripe Webhooks)

#### **Stripe Webhook Handler**

```typescript
// app/api/stripe/webhook/route.ts

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: any;
  try {
    const text = await req.text();
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signingSecret) {
      return NextResponse.json({ error: "Missing signing secret" }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(text, sig, signingSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // One-time payment for credits
      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        const md = pi.metadata || {};
        if (md.type === "credits") {
          const companyId = md.companyId;
          const tokens = Number(md.tokens || 0);
          const amountPaid = pi.amount_received || pi.amount;
          const currency = pi.currency || md.currency;
          
          if (companyId && tokens > 0) {
            await convex.mutation(api.credits.addCredits, {
              companyId,
              tokens,
              stripePaymentIntentId: pi.id,
              stripeCheckoutSessionId: undefined,
              amountPaid,
              currency,
            });
          }
        }
        break;
      }

      // Checkout session completed
      case "checkout.session.completed": {
        const session = event.data.object as any;
        
        // Credits purchase
        if (session.mode === "payment" && session.metadata?.type === "credits") {
          const companyId = session.metadata?.companyId;
          const tokens = Number(session.metadata?.tokens || 0);
          const amountPaid = session.amount_total;
          const currency = session.currency;
          
          if (companyId && tokens > 0) {
            await convex.mutation(api.credits.addCredits, {
              companyId,
              tokens,
              stripePaymentIntentId: session.payment_intent,
              stripeCheckoutSessionId: session.id,
              amountPaid,
              currency,
            });
          }
          break;
        }

        // Subscription checkout
        const companyId = session.metadata?.companyId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const planFromMetadata = session.metadata?.plan || "starter";
        
        if (companyId) {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            companyId,
            plan: planFromMetadata,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: undefined,
            status: "active",
          });
          
          await convex.mutation(api.subscriptions.recordTransaction, {
            companyId,
            action: "checkout_completed",
            plan: planFromMetadata,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            source: "stripe",
            eventType: "checkout.session.completed",
          });
        }
        break;
      }

      // Subscription lifecycle
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as any;
        const companyId = sub.metadata?.companyId;
        
        // Map price ID to plan
        let plan = "starter";
        const priceId = sub.items?.data?.[0]?.price?.id;
        if (priceId === env.PRO_MONTHLY_PRICE_ID) plan = "pro";
        if (priceId === env.STARTER_MONTHLY_PRICE_ID) plan = "starter";
        
        if (companyId) {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            companyId,
            plan,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: sub.current_period_end,
            status: sub.status,
          });
          
          await convex.mutation(api.subscriptions.recordTransaction, {
            companyId,
            action: event.type.endsWith("created") ? "created" : "updated",
            plan,
            status: sub.status,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            source: "stripe",
            eventType: event.type,
            currentPeriodEnd: sub.current_period_end,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const companyId = sub.metadata?.companyId;
        
        await convex.mutation(api.subscriptions.upsertSubscription, {
          companyId: companyId || "",
          plan: "free",
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: sub.current_period_end,
          status: sub.status,
        });
        
        await convex.mutation(api.subscriptions.recordTransaction, {
          companyId: companyId || "",
          action: "deleted",
          plan: "free",
          status: sub.status,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          source: "stripe",
          eventType: event.type,
          currentPeriodEnd: sub.current_period_end,
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

#### **Plan Configuration**

```typescript
// lib/plans.ts - CONFIGURATION POINT

export type PlanId = "free" | "starter" | "pro" | "business";

export type PlanInfo = {
  id: PlanId;
  title: string;
  prices: {
    monthly?: { label: string };
    yearly?: { label: string };
  };
  features: string[];
  entitlements: {
    scansPerMonth: number;
    storageMB: number;
  };
};

export const PLANS: Record<PlanId, PlanInfo> = {
  free: {
    id: "free",
    title: "Free",
    prices: {
      monthly: { label: "MYR 0.00/month" },
    },
    features: ["5 Scans per month"],
    entitlements: { scansPerMonth: 5, storageMB: 10 },
  },
  starter: {
    id: "starter",
    title: "Starter",
    prices: {
      monthly: { label: "MYR 9.90/month" },
      yearly: { label: "MYR 99.00/year" },
    },
    features: ["50 Scans per month", "Organization"],
    entitlements: { scansPerMonth: 50, storageMB: 100 },
  },
  pro: {
    id: "pro",
    title: "Pro",
    prices: {
      monthly: { label: "MYR 29.00/month" },
      yearly: { label: "MYR 299.00/year" },
    },
    features: ["200 Scans per month", "AI Summary", "Organization"],
    entitlements: { scansPerMonth: 200, storageMB: 300 },
  },
};
```

---

### C. Feature Gating Patterns

#### **React Hook for Subscription Access**

```typescript
// hooks/useSubscription.ts

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCompany } from "./useCompany";

export function useSubscription() {
  const { companyId } = useCompany();
  
  const subscription = useQuery(
    api.subscriptions.getSubscription,
    companyId ? { companyId } : "skip"
  );
  
  const entitlements = useQuery(
    api.subscriptions.getEntitlements,
    companyId ? { companyId } : "skip"
  );
  
  return {
    subscription,
    entitlements,
    plan: subscription?.plan || "free",
    isLoading: subscription === undefined || entitlements === undefined,
  };
}
```

#### **Feature Check Hook**

```typescript
// hooks/useFeatures.ts

"use client";

import { useSubscription } from "./useSubscription";

export function useFeatures() {
  const { plan, entitlements, isLoading } = useSubscription();
  
  const hasFeature = (feature: string) => {
    if (isLoading) return false;
    return entitlements?.features?.includes(feature) || false;
  };
  
  const canUseFeature = (requiredPlan: string) => {
    if (isLoading) return false;
    const planHierarchy = ["free", "starter", "pro", "business"];
    const currentIndex = planHierarchy.indexOf(plan);
    const requiredIndex = planHierarchy.indexOf(requiredPlan);
    return currentIndex >= requiredIndex;
  };
  
  return {
    hasFeature,
    canUseFeature,
    plan,
    entitlements,
    isLoading,
  };
}
```

#### **UI Component Guard (Example)**

```typescript
// components/guards/FeatureGuard.tsx

"use client";

import { useFeatures } from "@/hooks/useFeatures";
import { ReactNode } from "react";

interface FeatureGuardProps {
  plan?: "free" | "starter" | "pro" | "business";
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGuard({ 
  plan, 
  feature, 
  children, 
  fallback 
}: FeatureGuardProps) {
  const { canUseFeature, hasFeature, isLoading } = useFeatures();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  const hasAccess = plan 
    ? canUseFeature(plan) 
    : feature 
    ? hasFeature(feature) 
    : true;
  
  if (!hasAccess) {
    return fallback || (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          Upgrade to access this feature
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

---

## React Hooks & Providers

### 1. Tenant Context Hook

```typescript
// hooks/useCompany.ts - CORE TENANT RESOLUTION

"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useMemo } from "react";

export function useCompany() {
  const { organization } = useOrganization();
  const { user } = useUser();
  
  const companyId = useMemo(
    () => organization?.id || user?.id || "", 
    [organization?.id, user?.id]
  );
  
  const subjectType = useMemo(
    () => (companyId?.startsWith("org_") ? "organization" : companyId ? "user" : undefined), 
    [companyId]
  );
  
  return { companyId, subjectType } as const;
}
```

### 2. Convex Provider Setup

```typescript
// components/ConvexClientProvider.tsx

"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useUser, useOrganization } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const SettingsInitializer = ({ children }: { children: React.ReactNode }) => { 
  const { user } = useUser();
  const { organization } = useOrganization();
  const ensureSettings = useMutation(api.settings.ensureOrgSettings);
  const companyId = useMemo(
    () => organization?.id || user?.id, 
    [organization?.id, user?.id]
  );

  // Auto-create settings on first load
  useEffect(() => {
    if (!companyId || !user?.id) return;
    ensureSettings({
      companyId,
      subjectType: companyId.startsWith("org_") ? "organization" : "user",
      aiEnabled: true,
      updatedBy: user.id,
    }).catch(() => {/* no-op */});
  }, [companyId, user?.id, ensureSettings]);

  return children;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <SettingsInitializer>
        {children}
      </SettingsInitializer>
    </ConvexProviderWithClerk>
  );
}
```

### 3. Root Layout Integration

```typescript
// app/layout.tsx

import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

---

## N8N Integration Patterns

### 1. N8N Webhook Flow

**Architecture:**
1. User uploads file → Convex storage
2. Next.js API generates temporary URL
3. Call N8N webhook with image URL
4. N8N processes (OCR, AI extraction)
5. N8N calls back to Next.js API
6. Update Convex with extracted data

### 2. N8N Callback Handler

```typescript
// app/api/n8n/callback/route.ts - Simplified Example

import { NextRequest, NextResponse } from "next/server";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    
    // Verify shared secret
    const providedSecret = req.headers.get("x-n8n-secret") || json.secret;
    if (providedSecret !== process.env.N8N_CALLBACK_SHARED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expenseId = json.expenseId;
    if (!expenseId) {
      return NextResponse.json({ error: "expenseId required" }, { status: 400 });
    }

    // Extract data from N8N payload
    const merchantName = json.merchantName || json["Merchant Name"] || "";
    const transactionDate = json.transactionDate || json["Date"] || "";
    const transactionAmount = String(json.total || json["Total"] || "");
    const items = json.items || [];

    // Update Convex
    const result = await convex.mutation(api.expenses.updateExpenseWithExtractedData, {
      id: expenseId,
      merchantName,
      transactionDate,
      transactionAmount,
      items,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("N8N callback error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### 3. Environment Configuration

```typescript
// lib/env.ts - N8N Configuration

import { z } from "zod";

const EnvSchema = z.object({
  // N8N
  N8N_BASE_URL: z.string().url(),
  N8N_SCAN_WEBHOOK_PATH: z.string().startsWith("/"),
  N8N_CALLBACK_SHARED_SECRET: z.string().min(16),
  N8N_CALLBACK_URL: z.string().url(),
});

export const env = EnvSchema.parse({
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_SCAN_WEBHOOK_PATH: process.env.N8N_SCAN_WEBHOOK_PATH,
  N8N_CALLBACK_SHARED_SECRET: process.env.N8N_CALLBACK_SHARED_SECRET,
  N8N_CALLBACK_URL: process.env.N8N_CALLBACK_URL,
});

export function buildN8nScanUrl(params: {
  orgid: string;
  imageurl: string;
  action: "invoice" | "expense" | "bank";
}): string {
  const base = env.N8N_BASE_URL.replace(/\/$/, "");
  const path = env.N8N_SCAN_WEBHOOK_PATH;
  const url = new URL(`${base}${path}`);
  url.searchParams.set("orgid", params.orgid);
  url.searchParams.set("imageurl", params.imageurl);
  url.searchParams.set("action", params.action);
  return url.toString();
}
```

---

## Essential Configuration Files

### 1. Environment Variables Structure

```bash
# .env.local - REQUIRED CONFIGURATION

# ============================================
# Clerk Authentication
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# ============================================
# Convex Database
# ============================================
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx # For CI/CD

# ============================================
# Stripe Payments
# ============================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs (create in Stripe Dashboard)
STARTER_MONTHLY_PRICE_ID=price_xxx
PRO_MONTHLY_PRICE_ID=price_xxx
STARTER_YEARLY_PRICE_ID=price_xxx
PRO_YEARLY_PRICE_ID=price_xxx

# ============================================
# N8N Automation (Optional)
# ============================================
N8N_BASE_URL=https://your-n8n-instance.com
N8N_SCAN_WEBHOOK_PATH=/webhook/scan
N8N_CALLBACK_SHARED_SECRET=your-strong-secret-min-16-chars
N8N_CALLBACK_URL=https://your-app.com/api/n8n/callback

# ============================================
# Feature Limits (Optional Overrides)
# ============================================
FREE_STORAGE_MB=10
STARTER_STORAGE_MB=100
PRO_STORAGE_MB=300
```

### 2. Package.json Dependencies

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.12.6",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "convex": "^1.23.0",
    "lucide-react": "^0.525.0",
    "next": "15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.7",
    "stripe": "^18.5.0",
    "svix": "^1.76.1",
    "tailwind-merge": "^3.3.1",
    "zod": "^3.25.74"
  },
  "scripts": {
    "dev": "npm-run-all --parallel dev:frontend dev:backend",
    "dev:frontend": "next dev",
    "dev:backend": "convex dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 3. Convex Client Setup

```typescript
// lib/ConvexClient.ts - Server-side Convex Client

import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default convex;
```

### 4. Stripe Client Setup

```typescript
// lib/stripe.ts

import Stripe from "stripe";
import { env } from "./env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
```

---

## Deployment & Setup Guide

### Quick Start (3-Step Setup)

#### **Step 1: Install Dependencies**

```bash
npm install
# or
pnpm install
```

#### **Step 2: Configure Environment Variables**

Create `.env.local` with the required variables (see Environment Variables Structure above).

**Minimum Required:**
- Clerk keys (publishable + secret + webhook secret)
- Convex URL
- Stripe keys (publishable + secret + webhook secret)

#### **Step 3: Initialize Convex**

```bash
npx convex dev
```

This will:
1. Create your Convex project
2. Deploy the schema
3. Set up authentication with Clerk

### Webhook Configuration

#### **1. Clerk Webhooks**

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-app.com/api/clerk/webhook`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organizationMembership.created`
   - `organizationMembership.updated`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

#### **2. Stripe Webhooks**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### **3. N8N Webhooks (Optional)**

1. Create N8N workflow with webhook trigger
2. Set webhook path (e.g., `/webhook/scan`)
3. Configure callback to `https://your-app.com/api/n8n/callback`
4. Generate strong shared secret (min 16 chars)

### Stripe Product Setup

#### **Create Subscription Products**

```bash
# In Stripe Dashboard:
1. Products → Create Product
   - Name: "Starter Plan"
   - Recurring: Monthly
   - Price: 9.90 MYR
   - Copy Price ID → STARTER_MONTHLY_PRICE_ID

2. Products → Create Product
   - Name: "Pro Plan"
   - Recurring: Monthly
   - Price: 29.00 MYR
   - Copy Price ID → PRO_MONTHLY_PRICE_ID
```

### Database Initialization

The schema auto-deploys when you run `convex dev`. No manual migration needed.

**Initial Data Seeding (Optional):**

```typescript
// convex/seed.ts

import { mutation } from "./_generated/server";

export const seedPlans = mutation({
  handler: async (ctx) => {
    // Seed initial data if needed
    console.log("Database ready!");
  },
});
```

---

## Critical Questions Answered

### 1. How do you handle tenant switching in Convex queries?

**Answer:** Use the `useCompany()` hook to get the current `companyId`, then pass it to all queries:

```typescript
const { companyId } = useCompany();
const expenses = useQuery(
  api.expenses.list,
  companyId ? { companyId } : "skip"
);
```

Convex automatically re-runs queries when `companyId` changes (org switch).

### 2. What's the pattern for scoping mutations to a tenant?

**Answer:** Always include `companyId` in mutation args and validate it:

```typescript
export const createExpense = mutation({
  args: {
    companyId: v.string(),
    // ... other fields
  },
  handler: async (ctx, args) => {
    // Optional: Verify user has access to this companyId via Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // Insert with tenant isolation
    return await ctx.db.insert("expenses", {
      companyId: args.companyId,
      userId: identity.subject,
      // ... other fields
    });
  },
});
```

### 3. How are real-time subscriptions filtered per tenant?

**Answer:** Convex queries automatically filter by index. When you query with `companyId`, only that tenant's data is returned and subscribed to:

```typescript
// This query only subscribes to changes for the current companyId
const expenses = await ctx.db
  .query("expenses")
  .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
  .collect();
```

Real-time updates only trigger when data matching the query changes.

### 4. What's the minimal Clerk + Convex setup for authentication?

**Answer:**

1. **Convex auth config:**
```typescript
// convex/auth.config.ts
export default {
  providers: [{
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
    applicationID: "convex",
  }],
};
```

2. **Clerk provider wrapper:**
```typescript
<ClerkProvider>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

3. **Webhook sync:** Set up `/api/clerk/webhook` to sync user data to Convex.

### 5. How do you structure Convex for scalability?

**Best Practices:**

1. **Indexes on all query fields:**
```typescript
.index("by_companyId", ["companyId"])
.index("by_companyId_status", ["companyId", "status"])
```

2. **Pagination for large datasets:**
```typescript
export const listPaginated = query({
  args: { companyId: v.string(), cursor: v.optional(v.string()) },
  handler: async (ctx, { companyId, cursor }) => {
    const results = await ctx.db
      .query("expenses")
      .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
      .order("desc")
      .paginate({ cursor, numItems: 50 });
    return results;
  },
});
```

3. **Denormalize for read performance:**
```typescript
// Store frequently accessed data directly
{
  staffId: v.id("staff"),
  staffName: v.string(), // Denormalized for display
}
```

4. **Use actions for external API calls:**
```typescript
export const sendEmail = action({
  args: { to: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    // Call external API (Stripe, SendGrid, etc.)
    await fetch("https://api.sendgrid.com/...", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },
});
```

---

## Portable SaaS Core Checklist

### ✅ Copy-Paste Ready Components

- [x] **Convex Schema** - Core tables with tenant isolation
- [x] **Authentication Flow** - Clerk webhook → Convex sync
- [x] **Subscription Management** - Stripe webhooks → Convex state
- [x] **Tenant Context** - `useCompany()` hook
- [x] **Feature Gating** - `useFeatures()` + `FeatureGuard`
- [x] **Plan Configuration** - `lib/plans.ts`
- [x] **Environment Setup** - `.env.local` template
- [x] **Webhook Handlers** - Clerk + Stripe + N8N
- [x] **Provider Setup** - `ConvexClientProvider`

### 🔧 Configuration Points

1. **Schema:** Add business-specific tables to `convex/schema.ts`
2. **Plans:** Modify `lib/plans.ts` with your pricing
3. **Features:** Update `getEntitlements()` query with your features
4. **Webhooks:** Add N8N workflows for your use case
5. **UI:** Customize Shadcn components

### 🚀 Deployment Checklist






- [ ] Set up Clerk application
- [ ] Create Convex project
- [ ] Configure Stripe products
- [ ] Set environment variables
- [ ] Deploy webhooks
- [ ] Test subscription flow
- [ ] Test tenant switching
- [ ] Test feature gating

---

## Next Steps

1. **Clone this structure** into your new project
2. **Run `npm install`** to install dependencies
3. **Configure `.env.local`** with your API keys
4. **Run `npx convex dev`** to initialize database
5. **Set up webhooks** in Clerk and Stripe dashboards
6. **Customize** schema and features for your business logic

**You now have a working multi-tenant SaaS foundation!** 🎉

---

## Additional Resources

- **Convex Docs:** https://docs.convex.dev
- **Clerk Docs:** https://clerk.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Shadcn UI:** https://ui.shadcn.com
- **Next.js 15:** https://nextjs.org/docs

---

**End of Document**

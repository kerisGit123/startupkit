import { NextResponse } from "next/server";
import { Webhook } from "svix";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";
import {
  CLERK_PLAN_SLUGS,
  INTERNAL_KEY_FROM_CLERK_SLUG,
  type InternalPlanKey,
} from "@/lib/plan-config";

/**
 * Derive an internal plan key from a Clerk subscription webhook payload.
 * Clerk stores the plan slug in varying locations per event — try each.
 *
 * Distinguishes two cases:
 *   - No plan info present (cancellation / downgrade) → return "free"
 *   - Plan slug PRESENT but unrecognized (mapping bug) → throw
 *
 * Throwing surfaces the bug loudly via webhook 5xx instead of silently
 * downgrading the user. Add the new slug to lib/plan-config.ts.
 */
function extractInternalPlanFromPayload(data: any): InternalPlanKey {
  const candidates: (string | undefined)[] = [
    data?.plan?.slug,
    data?.plan?.key,
    data?.plan_slug,
  ];

  // For subscription events with items array, prefer the ACTIVE item
  // over the first item (which might be an ended/canceled plan from a
  // previous subscription that's being replaced).
  if (data?.items && Array.isArray(data.items)) {
    const activeItem = data.items.find(
      (i: any) => i.status === "active" || i.status === "upcoming",
    );
    if (activeItem) {
      candidates.push(activeItem.plan?.slug, activeItem.plan?.key);
    }
    // Fallback: first item (only if no active item found)
    candidates.push(data.items[0]?.plan?.slug, data.items[0]?.plan?.key);
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const internal = INTERNAL_KEY_FROM_CLERK_SLUG[candidate];
    if (internal) return internal;
  }

  const presentSlugs = candidates.filter((c): c is string => !!c);
  if (presentSlugs.length > 0) {
    // Plan slug(s) present but none mapped — almost certainly a missing
    // entry in lib/plan-config.ts. Throw so the webhook returns 5xx and
    // the operator gets a loud signal instead of a silent downgrade.
    throw new Error(
      `[clerk-webhook] Unrecognized plan slug in payload: ${JSON.stringify(presentSlugs)}. ` +
        `Add it to lib/plan-config.ts (CLERK_PLAN_SLUGS + INTERNAL_KEY_FROM_CLERK_SLUG). ` +
        `Known slugs: ${JSON.stringify(Object.keys(INTERNAL_KEY_FROM_CLERK_SLUG))}.`,
    );
  }

  return "free";
}

/** Extract the subscribing user's ID from a Clerk subscription payload. */
function extractPayerUserId(data: any): string | null {
  return (
    data?.payer?.user_id ??
    data?.user_id ??
    data?.payer_user_id ??
    data?.subject ??
    null
  );
}

/**
 * Clerk webhook handler — the single source of truth.
 *
 * Clerk Dashboard → Webhooks points here:
 *   https://<your-ngrok>.ngrok-free.app/api/clerk/webhook
 *
 * Responsibilities:
 *   1. Verify svix signature.
 *   2. user.created / user.updated → sync user profile + settings to Convex
 *   3. user.deleted → clean up the user in Convex
 *   4. user.created → track referral if present + complete on email verify
 *   5. organization.created → write ownership marker + initial ownerPlan snapshot
 *   6. organizationMembership.* → ensure org settings exist in Convex
 *   7. subscription.created / updated → propagate owner's new plan to all
 *      workspaces they own (personal + orgs)
 *   8. subscription.deleted → propagate "free" to all their workspaces
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.error("[WEBHOOK] Clerk signature verification failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const body = typeof evt === "string" ? JSON.parse(evt) : evt;
    const type: string = body?.type || "";
    const data = body?.data || {};

    // ─── User lifecycle ──────────────────────────────────────────────
    if (type === "user.created" || type === "user.updated") {
      const u: any = data;
      const email = u?.email_addresses?.[0]?.email_address || u?.email;
      const firstName = u?.first_name || u?.firstName;
      const lastName = u?.last_name || u?.lastName;
      const fullName =
        u?.full_name || [firstName, lastName].filter(Boolean).join(" ");
      const imageUrl = u?.image_url || u?.imageUrl;
      const username = u?.username;

      // Convex v.optional(v.string()) accepts undefined but NOT null.
      // Google OAuth users often have null for username, firstName, etc.
      // Convert all nulls to undefined to prevent ArgumentValidationError.
      try {
        await convex.mutation(api.users.upsertFromClerk, {
          clerkUserId: u?.id ?? undefined,
          email: email ?? undefined,
          firstName: firstName ?? undefined,
          lastName: lastName ?? undefined,
          fullName: fullName ?? undefined,
          imageUrl: imageUrl ?? undefined,
          username: username ?? undefined,
        });
      } catch (err) {
        console.error("[WEBHOOK] upsertFromClerk failed (non-fatal):", err);
        // Continue — the ownerPlan snapshot + settings should still be seeded
      }

      try {
        await convex.mutation(api.settings.ensureOrgSettings, {
          companyId: u?.id,
          subjectType: "user",
          aiEnabled: true,
          updatedBy: u?.id || "system",
        });
      } catch (err) {
        console.error("[WEBHOOK] ensureOrgSettings failed (non-fatal):", err);
      }

      // Seed initial ownerPlan snapshot for the user's personal workspace.
      // New users start on Free. Subscription events later will upgrade
      // this value and propagate to any orgs they create.
      // This runs independently of upsertFromClerk — if the user record
      // insert fails (e.g. null username), the snapshot still gets created.
      if (u?.id) {
        try {
          await convex.mutation(api.credits.setOwnerPlan, {
            companyId: u.id,
            creatorUserId: u.id,
            ownerPlan: "free",
            organizationName: "Personal Workspace",
          });
        } catch (err) {
          console.error("[WEBHOOK] Failed to seed initial ownerPlan for user", err);
        }
      }

      // Track referral on signup
      if (type === "user.created") {
        const referralCode =
          u?.unsafe_metadata?.referralCode || u?.public_metadata?.referralCode;
        console.log("[WEBHOOK] user.created referral check", {
          userId: u?.id,
          referralCode,
        });

        if (referralCode) {
          try {
            await convex.mutation(api.referrals.trackReferral, {
              referralCode: referralCode as string,
              newUserId: u?.id,
            });
          } catch (error) {
            console.error("[WEBHOOK] Failed to track referral", error);
          }
        }
      }

      // Complete referral on email verification
      if (type === "user.updated") {
        const emailVerified =
          u?.email_addresses?.[0]?.verification?.status === "verified";

        if (emailVerified) {
          try {
            await convex.mutation(api.referrals.completeReferral, {
              referredUserId: u?.id,
            });
          } catch {
            // Silent: user may not have any pending referral
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (type === "user.deleted") {
      const clerkUserId = data?.id;
      if (clerkUserId) {
        await convex.mutation(api.users.deleteFromClerk, { clerkUserId });
      }
      return NextResponse.json({ ok: true });
    }

    // ─── Organization lifecycle ──────────────────────────────────────
    // Critical for the ownership model: records who created the org so
    // credits.getCompanyCreator can verify during transferCredits.
    if (type === "organization.created") {
      const organizationId = data?.id as string;
      const creatorId = data?.created_by as string;
      const organizationName = (data?.name as string) ?? undefined;

      if (!organizationId || !creatorId) {
        console.error("[WEBHOOK] organization.created missing ids", {
          organizationId,
          creatorId,
        });
        return NextResponse.json(
          { error: "Missing ids in payload" },
          { status: 400 },
        );
      }

      console.log("[WEBHOOK] organization.created", {
        organizationId,
        creatorId,
        organizationName,
      });

      // Idempotent ownership marker
      try {
        await convex.mutation(api.credits.recordOrgCreator, {
          companyId: organizationId,
          userId: creatorId,
        });
      } catch (err) {
        console.error("[WEBHOOK] Failed to record org creator marker", {
          organizationId,
          creatorId,
          err,
        });
        // Non-fatal: ownership can still be derived from fallback paths
      }

      // Write initial ownerPlan snapshot for the new org, including the
      // org name so the audit trail is human-readable after the Clerk
      // org is eventually deleted.
      try {
        const creatorSnapshot = await convex.query(api.credits.getOwnerPlan, {
          companyId: creatorId,
        });
        const creatorPlan = creatorSnapshot?.ownerPlan ?? "free";

        await convex.mutation(api.credits.setOwnerPlan, {
          companyId: organizationId,
          creatorUserId: creatorId,
          ownerPlan: creatorPlan,
          organizationName,
        });
      } catch (err) {
        console.error("[WEBHOOK] Failed to write ownerPlan snapshot for new org", err);
      }

      // Also seed org settings so the org has an entry in Convex
      try {
        await convex.mutation(api.settings.ensureOrgSettings, {
          companyId: organizationId,
          subjectType: "organization",
          aiEnabled: true,
          updatedBy: creatorId,
        });
      } catch (err) {
        console.error("[WEBHOOK] Failed to ensure org settings", err);
      }

      return NextResponse.json({ ok: true });
    }

    // ─── Subscription lifecycle ───────────────────────────────────────
    // When a user's Clerk Billing subscription changes, propagate the
    // new plan to all workspaces they own (personal + any created orgs).
    if (
      type === "subscription.created" ||
      type === "subscription.updated" ||
      type === "subscriptionItem.active" ||
      type === "subscriptionItem.updated"
    ) {
      // DEBUG: log the full payload so we can see Clerk's actual field names
      console.log(`[WEBHOOK] ${type} — FULL PAYLOAD:`, JSON.stringify(data, null, 2));

      const payerUserId = extractPayerUserId(data);
      const newPlan = extractInternalPlanFromPayload(data);

      console.log(`[WEBHOOK] ${type} — EXTRACTED:`, {
        payerUserId,
        newPlan,
        payerAttempts: {
          "data.payer.user_id": data?.payer?.user_id,
          "data.user_id": data?.user_id,
          "data.payer_user_id": data?.payer_user_id,
          "data.subject": data?.subject,
        },
        planAttempts: {
          "data.plan.slug": data?.plan?.slug,
          "data.plan.key": data?.plan?.key,
          "data.plan_slug": data?.plan_slug,
          "data.items[0].plan.slug": data?.items?.[0]?.plan?.slug,
          "data.items[0].plan.key": data?.items?.[0]?.plan?.key,
        },
      });

      if (!payerUserId) {
        console.error(`[WEBHOOK] ${type} missing payer user ID`);
        return NextResponse.json({ ok: true, ignored: "missing_user_id" });
      }

      try {
        const result = await convex.mutation(
          api.credits.propagateOwnerPlanChange,
          {
            ownerUserId: payerUserId,
            newPlan,
          },
        );
        console.log(`[WEBHOOK] Propagated plan change`, result);
      } catch (err) {
        console.error(`[WEBHOOK] Failed to propagate plan change`, err);
      }

      return NextResponse.json({ ok: true });
    }

    // Subscription cancellation — owner falls back to Free across all
    // their workspaces. Personal workspace loses paid features, and any
    // orgs they own drop to Free tier features until re-subscribed.
    if (
      type === "subscription.deleted" ||
      type === "subscriptionItem.canceled" ||
      type === "subscriptionItem.ended"
    ) {
      // DEBUG: log the full payload
      console.log(`[WEBHOOK] ${type} — FULL PAYLOAD:`, JSON.stringify(data, null, 2));

      const payerUserId = extractPayerUserId(data);

      console.log(`[WEBHOOK] ${type} — EXTRACTED:`, { payerUserId });

      if (!payerUserId) {
        return NextResponse.json({ ok: true, ignored: "missing_user_id" });
      }

      try {
        const result = await convex.mutation(
          api.credits.propagateOwnerPlanChange,
          {
            ownerUserId: payerUserId,
            newPlan: "free",
          },
        );
        console.log(`[WEBHOOK] Propagated cancellation to free`, result);
      } catch (err) {
        console.error(`[WEBHOOK] Failed to propagate cancellation`, err);
      }

      return NextResponse.json({ ok: true });
    }

    // ─── Organization membership ─────────────────────────────────────
    if (
      type === "organizationMembership.created" ||
      type === "organizationMembership.updated"
    ) {
      const orgId = data?.organization?.id;
      if (orgId) {
        await convex.mutation(api.settings.ensureOrgSettings, {
          companyId: orgId,
          subjectType: "organization",
          aiEnabled: true,
          updatedBy: data?.public_user_data?.user_id || "system",
        });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: type });
  } catch (e: any) {
    console.error("[WEBHOOK] Clerk handler error", e?.message);
    return NextResponse.json(
      { error: "Unhandled webhook" },
      { status: 500 },
    );
  }
}

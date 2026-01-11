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

    if (type === "user.created" || type === "user.updated") {
      const u: any = data;
      const email = u?.email_addresses?.[0]?.email_address || u?.email;
      const firstName = u?.first_name || u?.firstName;
      const lastName = u?.last_name || u?.lastName;
      const fullName = u?.full_name || [firstName, lastName].filter(Boolean).join(" ");
      const imageUrl = u?.image_url || u?.imageUrl;
      const username = u?.username;

      await convex.mutation(api.users.upsertFromClerk, {
        clerkUserId: u?.id,
        email,
        firstName,
        lastName,
        fullName,
        imageUrl,
        username,
      });

      await convex.mutation(api.settings.ensureOrgSettings, {
        companyId: u?.id,
        subjectType: "user",
        aiEnabled: true,
        updatedBy: u?.id || "system",
      });

      // Track referral if user signed up with referral code
      if (type === "user.created") {
        const referralCode = u?.unsafe_metadata?.referralCode || u?.public_metadata?.referralCode;
        console.log("🔍 User created - checking for referral code:", {
          userId: u?.id,
          hasUnsafeMetadata: !!u?.unsafe_metadata?.referralCode,
          hasPublicMetadata: !!u?.public_metadata?.referralCode,
          referralCode: referralCode,
        });
        
        if (referralCode) {
          try {
            console.log("📝 Tracking referral:", referralCode);
            await convex.mutation(api.referrals.trackReferral, {
              referralCode: referralCode as string,
              newUserId: u?.id,
            });
            console.log("✅ Referral tracked successfully");
          } catch (error) {
            console.error("❌ Failed to track referral:", error);
          }
        } else {
          console.log("ℹ️ No referral code found in user metadata");
        }
      }

      // Complete referral and award credits when email is verified
      if (type === "user.updated") {
        const emailVerified = u?.email_addresses?.[0]?.verification?.status === "verified";
        console.log("🔍 User updated - checking email verification:", {
          userId: u?.id,
          emailVerified: emailVerified,
        });
        
        if (emailVerified) {
          try {
            console.log("📧 Email verified - completing referral for user:", u?.id);
            const result = await convex.mutation(api.referrals.completeReferral, {
              referredUserId: u?.id,
            });
            console.log("✅ Referral completed:", result);
          } catch (error) {
            // Silently fail if no pending referral (user might not have used referral code)
            console.log("ℹ️ No pending referral to complete for user:", u?.id);
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

    if (type === "organizationMembership.created" || type === "organizationMembership.updated") {
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Clerk webhook handler error", e?.message);
    return NextResponse.json({ error: "Unhandled webhook" }, { status: 500 });
  }
}

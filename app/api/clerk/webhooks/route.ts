import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import convex from "@/lib/ConvexClient";
import { api } from "@/convex/_generated/api";
import { canCreateOrg } from "@/lib/org-limits";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Handle organization creation
    if (type === "organization.created") {
      const { id: organizationId, name, created_by: creatorId } = data;
      
      if (!creatorId) {
        console.error("[WEBHOOK] Organization created without creator ID", { organizationId });
        return NextResponse.json({ error: "Missing creator ID" }, { status: 400 });
      }

      // Get user's subscription
      const subscription = await convex.query(api.subscriptions.getSubscription, {
        companyId: creatorId
      });

      const plan = subscription?.plan || "free";
      
      // Get current organization count
      const { clerkClient } = await auth();
      const user = await clerkClient.users.getUser(creatorId);
      const currentOrgCount = user.organizationMemberships?.length || 0;

      // Check if user can create organization
      if (!canCreateOrg(plan, currentOrgCount)) {
        console.log("[WEBHOOK] Blocking organization creation", { 
          userId: creatorId, 
          plan, 
          currentOrgCount,
          organizationId 
        });

        // Delete the organization that was just created
        await clerkClient.organizations.deleteOrganization(organizationId);
        
        return NextResponse.json({ 
          error: "Organization creation not allowed for your plan",
          plan,
          currentOrgCount,
          allowedOrgs: 0
        }, { status: 403 });
      }

      console.log("[WEBHOOK] Organization creation allowed", { 
        userId: creatorId, 
        plan, 
        currentOrgCount,
        organizationId 
      });

      return NextResponse.json({ success: true });
    }

    // Handle organization membership creation (for member limit enforcement)
    if (type === "organizationMembership.created") {
      const { organization, public_user_data: userData } = data;
      const { id: organizationId } = organization;
      const { user_id: userId } = userData;

      // Get organization admin's subscription
      const adminMembership = await convex.query(api.organizations.getAdminMembership, {
        organizationId
      });

      if (!adminMembership) {
        console.error("[WEBHOOK] No admin found for organization", { organizationId });
        return NextResponse.json({ error: "No admin found" }, { status: 400 });
      }

      const adminSubscription = await convex.query(api.subscriptions.getSubscription, {
        companyId: adminMembership.userId
      });

      const plan = adminSubscription?.plan || "free";
      
      // Get current member count
      const memberships = await convex.query(api.organizations.getMemberships, {
        organizationId
      });

      const currentMemberCount = memberships.length;

      // Check if organization can accept more members
      if (!canInviteMember(plan, currentMemberCount)) {
        console.log("[WEBHOOK] Blocking member invitation", { 
          organizationId,
          plan,
          currentMemberCount,
          userId
        });

        // Remove the membership that was just created
        const { clerkClient } = await auth();
        await clerkClient.organizations.deleteOrganizationMembership(organizationId, userId);
        
        return NextResponse.json({ 
          error: "Organization member limit reached",
          plan,
          currentMemberCount
        }, { status: 403 });
      }

      console.log("[WEBHOOK] Member invitation allowed", { 
        organizationId,
        plan,
        currentMemberCount,
        userId
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Clerk webhook error:", error);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}

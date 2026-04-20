import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * One-shot bootstrap: if the calling user has Clerk publicMetadata.role
 * === "super_admin", insert/upgrade them in the admin_users table.
 * After this, /admin/fraud-check (and any other Convex queries gated on
 * admin_users) will recognize them.
 *
 * Idempotent — safe to call multiple times.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "super_admin") {
    return NextResponse.json(
      {
        error:
          "Forbidden — your Clerk publicMetadata.role must be 'super_admin' to self-bootstrap. Set it in the Clerk dashboard first.",
      },
      { status: 403 },
    );
  }

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) {
    return NextResponse.json(
      { error: "User has no primary email address" },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    const result = await convex.mutation(api.fraudCheck.bootstrapSuperAdmin, {
      clerkUserId: userId,
      email,
      _secret: process.env.WEBHOOK_SECRET,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[bootstrap-super-admin] error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Bootstrap failed" },
      { status: 500 },
    );
  }
}

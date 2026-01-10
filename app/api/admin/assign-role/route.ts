import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();

    // Get current user to check if they're already a super admin
    const currentUser = await client.users.getUser(currentUserId);
    const currentRole = currentUser.publicMetadata.role as string;

    // Only super admins can assign roles (or allow first-time setup)
    const isSuperAdmin = currentRole === "super_admin";
    
    // For initial setup: allow if no super admins exist yet
    const allUsers = await client.users.getUserList();
    const hasSuperAdmin = allUsers.data.some(
      (u: { publicMetadata: { role?: string } }) => u.publicMetadata.role === "super_admin"
    );

    if (!isSuperAdmin && hasSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can assign roles" },
        { status: 403 }
      );
    }

    const { targetUserId, role } = await req.json();

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "Missing targetUserId or role" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["super_admin", "billing_admin", "support_admin", "user"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Update user metadata
    await client.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        role: role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role ${role} assigned to user ${targetUserId}`,
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

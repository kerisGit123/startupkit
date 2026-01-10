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

    const { targetUserId, email, role } = await req.json();

    if ((!targetUserId && !email) || !role) {
      return NextResponse.json(
        { error: "Missing targetUserId/email or role" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["super_admin", "billing_admin", "support_admin", "user"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Find user by email if email provided instead of userId
    let userId = targetUserId;
    if (!userId && email) {
      const users = await client.users.getUserList({ emailAddress: [email] });
      if (users.data.length === 0) {
        return NextResponse.json(
          { error: `No user found with email: ${email}` },
          { status: 404 }
        );
      }
      userId = users.data[0].id;
    }

    // Update user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role ${role} assigned to user ${email || userId}`,
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

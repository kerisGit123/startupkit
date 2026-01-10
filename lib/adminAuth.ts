import { auth, clerkClient } from "@clerk/nextjs/server";

export type AdminRole = "super_admin" | "billing_admin" | "support_admin" | "user";

export interface AdminUser {
  userId: string;
  email: string;
  role: AdminRole;
}

/**
 * Check if user has admin role
 */
export async function getAdminRole(): Promise<AdminRole | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata.role as AdminRole;

    return role || "user";
  } catch (error) {
    console.error("Error getting admin role:", error);
    return null;
  }
}

/**
 * Require admin access (any admin role)
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata.role as AdminRole;
  const email = user.emailAddresses[0]?.emailAddress || "";

  const adminRoles: AdminRole[] = ["super_admin", "billing_admin", "support_admin"];
  
  if (!role || !adminRoles.includes(role)) {
    throw new Error("Forbidden - Admin access required");
  }

  return { userId, email, role };
}

/**
 * Require specific admin role or higher
 */
export async function requireAdminRole(minRole: AdminRole): Promise<AdminUser> {
  const admin = await requireAdmin();

  const roleHierarchy: Record<AdminRole, number> = {
    super_admin: 3,
    billing_admin: 2,
    support_admin: 2,
    user: 0,
  };

  const userLevel = roleHierarchy[admin.role] || 0;
  const requiredLevel = roleHierarchy[minRole] || 0;

  if (userLevel < requiredLevel) {
    throw new Error(`Forbidden - ${minRole} access required`);
  }

  return admin;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const role = await getAdminRole();
    return role === "super_admin";
  } catch {
    return false;
  }
}

/**
 * Check if user has any admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const role = await getAdminRole();
    return role !== null && role !== "user";
  } catch {
    return false;
  }
}

/**
 * Get current admin user info
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

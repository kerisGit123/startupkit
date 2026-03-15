/**
 * Auth Utilities - Centralized authentication and user management functions
 */

import { User } from "@clerk/nextjs/server";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@clerk/nextjs"; // ✅ Import useOrganization hook

// Extend the User type to include organizationMemberships
interface ExtendedUser extends User {
  organizationMemberships?: Array<{
    organization: {
      id: string;
      name: string;
      slug: string;
      image_url?: string;
      public_metadata?: Record<string, unknown>;
      private_metadata?: Record<string, unknown>;
      created_at: number;
      updated_at: number;
    };
  }>;
}

export type ExtendedUserOrNull = ExtendedUser | null | undefined;

/**
 * Get the current user's companyId from Clerk authentication
 * This is the central function for determining companyId throughout the application
 * 
 * @param user - Clerk user object (from useUser() or server-side auth)
 * @returns companyId string - Currently active organization ID if selected, otherwise user ID
 */
export function getCurrentCompanyId(user: ExtendedUserOrNull): string {
  if (!user) {
    console.warn("[AuthUtils] No user provided to getCurrentCompanyId");
    return "";
  }

  // Check if user has organization memberships
  if (user.organizationMemberships && user.organizationMemberships.length > 0) {
    // ✅ FIX: Check for currently active organization first
    // Look for organization that matches user's current active organization
    // In Clerk, the active organization should be determined by the auth context
    
    // For client-side, we should use useOrganization() hook instead
    // For server-side, we should use auth().orgId
    // This function is a fallback - the primary methods should be used in components
    
    // TEMPORARY: Use first organization but log warning about active organization detection
    const orgMembership = user.organizationMemberships[0];
    
    if (orgMembership.organization) {
      // User is in an organization
      const orgId = orgMembership.organization.id;
      console.log("[AuthUtils] Using organization ID from Clerk (first membership):", orgId);
      console.log("[AuthUtils] WARNING: Consider using useOrganization() hook for active organization detection");
      return orgId;
    } else {
      // User has membership but no organization (edge case)
      console.log("[AuthUtils] User has membership but no organization, falling back to user ID");
      return user.id;
    }
  } else {
    // User has no organization memberships (personal account)
    console.log("[AuthUtils] Using personal account ID from Clerk:", user.id);
    return user.id;
  }
}

/**
 * Client-side hook to get current companyId from Clerk authentication
 * This is the recommended way to get companyId in React components
 * Uses useOrganization() to get the currently active organization
 * 
 * @returns string - Current user's companyId from Clerk authentication
 */
export function useCurrentCompanyId(): string {
  const { user } = useUser();
  const { organization } = useOrganization(); // ✅ Get currently active organization
  
  // ✅ KEY FIX: Check if user has actually selected an organization
  // If organization is null, user is in personal mode
  if (organization) {
    console.log("[AuthUtils] Using active organization ID:", organization.id);
    return organization.id;
  }
  
  // Otherwise, user is in personal mode - use user ID
  if (user) {
    console.log("[AuthUtils] Using personal account ID (no active organization):", user.id);
    return user.id;
  }
  
  // No user authenticated
  console.warn("[AuthUtils] No user authenticated");
  return "";
}

/**
 * Server-side function to get current companyId from Clerk authentication
 * Use this in API routes and server-side code
 * 
 * @param auth - Clerk auth object from server-side auth()
 * @returns string - Current user's companyId from Clerk authentication
 */
export function getServerCurrentCompanyId(auth: { userId?: string | null }): string {
  // Import server-side utilities
  const { getServerCurrentCompanyId: getServerCurrentCompanyIdFn } = require("./auth-utils-server");
  return getServerCurrentCompanyIdFn(auth);
}

/**
 * Check if the current user is in an organization (vs personal account)
 * 
 * @param user - Clerk user object
 * @returns boolean - true if user is in an organization
 */
export function isOrganizationUser(user: ExtendedUserOrNull): boolean {
  if (!user) return false;
  
  return user.organizationMemberships && 
         user.organizationMemberships.length > 0 && 
         !!user.organizationMemberships[0]?.organization;
}

/**
 * Check if the current user is using a personal account
 * 
 * @param user - Clerk user object
 * @returns boolean - true if using personal account
 */
export function isPersonalAccount(user: ExtendedUserOrNull): boolean {
  return !isOrganizationUser(user);
}

/**
 * Get user type for logging/display purposes
 * 
 * @param user - Clerk user object
 * @returns string - "organization" or "personal"
 */
export function getUserType(user: ExtendedUserOrNull): string {
  return isOrganizationUser(user) ? "organization" : "personal";
}

/**
 * Middleware function to check if user is authenticated
 * Redirects to main page if not authenticated
 * 
 * @param auth - Clerk auth object
 * @param redirectUrl - URL to redirect to if not authenticated (default: "/")
 * @returns void
 */
export function requireAuth(auth: { userId?: string | null }, redirectUrl: string = "/"): void {
  if (!auth.userId) {
    console.log("[AuthUtils] User not authenticated, redirecting to:", redirectUrl);
    // In a real Next.js app, this would be used in middleware
    // For now, this is a placeholder for the logic
    throw new Error("Authentication required");
  }
}

/**
 * Get user display name with fallback
 * 
 * @param user - Clerk user object
 * @returns string - User's display name or fallback
 */
export function getUserDisplayName(user: ExtendedUserOrNull): string {
  if (!user) return "Unknown User";
  
  return user.fullName || 
         user.username || 
         user.primaryEmailAddress?.emailAddress || 
         `User ${user.id.slice(-8)}`;
}

/**
 * Get user email with fallback
 * 
 * @param user - Clerk user object
 * @returns string - User's email or fallback
 */
export function getUserEmail(user: ExtendedUserOrNull): string {
  if (!user) return "";
  
  return user.primaryEmailAddress?.emailAddress || 
         user.username ? `${user.username}@example.com` : "";
}

/**
 * Debug function to log user information from Clerk authentication
 * 
 * @param user - Clerk user object
 * @param context - Context for the log (e.g., "ElementLibrary", "R2Upload")
 * @param currentCompanyId - Current companyId (from useCurrentCompanyId hook)
 */
export function logUserInfo(user: ExtendedUserOrNull, context: string, currentCompanyId?: string): void {
  if (!user) {
    console.log(`[${context}] No user available from Clerk`);
    return;
  }

  console.log(`[${context}] Clerk User Info:`, {
    id: user.id,
    email: getUserEmail(user),
    displayName: getUserDisplayName(user),
    companyId: currentCompanyId || getCurrentCompanyId(user), // Use provided companyId or fallback
    userType: getUserType(user),
    hasOrganization: !!user.organizationMemberships?.length,
    organizationCount: user.organizationMemberships?.length || 0,
    primaryOrganization: user.organizationMemberships?.[0]?.organization?.id || "None",
    authenticationSource: "Clerk"
  });
}

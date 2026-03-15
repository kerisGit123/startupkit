/**
 * Server-side Auth Utilities - For API routes and server-side code only
 * This file contains functions that require @clerk/clerk-sdk-node
 */

import { getCurrentCompanyId } from "./auth-utils";
import type { ExtendedUserOrNull } from "./auth-utils";

// Initialize Clerk SDK
const { Clerk } = require("@clerk/clerk-sdk-node");

// Initialize Clerk with your secret key
const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Server-side function to get current companyId from Clerk authentication
 * Use this in API routes and server-side code
 * 
 * @param auth - Clerk auth object from server-side auth()
 * @returns string - Current user's companyId from Clerk authentication
 */
export function getServerCurrentCompanyId(auth: { userId?: string | null }): string {
  if (!auth.userId) {
    console.warn("[AuthUtils-Server] No authenticated user in server context");
    return "";
  }

  try {
    const user = clerk.users.getUser(auth.userId);
    return getCurrentCompanyId(user as ExtendedUserOrNull);
  } catch (error) {
    console.error("[AuthUtils-Server] Error getting user in server context:", error);
    return "";
  }
}

/**
 * Server-side function to get user object from Clerk
 * 
 * @param userId - Clerk user ID
 * @returns Promise<ExtendedUserOrNull> - User object or null
 */
export async function getServerUser(userId: string): Promise<ExtendedUserOrNull> {
  try {
    const user = await clerk.users.getUser(userId);
    return user as ExtendedUserOrNull;
  } catch (error) {
    console.error("[AuthUtils-Server] Error getting user:", error);
    return null;
  }
}

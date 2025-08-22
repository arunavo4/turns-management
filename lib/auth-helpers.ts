import { auth } from "./auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Get session from request headers for API routes
 */
export async function getSession(request?: NextRequest) {
  try {
    // Get headers
    const headersObj = request ? Object.fromEntries(request.headers.entries()) : Object.fromEntries((await headers()).entries());
    
    // Use Better Auth's api.getSession method
    const session = await auth.api.getSession({
      headers: headersObj,
    });

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Helper to check if user is authenticated
 */
export async function requireAuth(request?: NextRequest) {
  const session = await getSession(request);
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * Helper to check if user has specific role
 */
export async function requireRole(role: string | string[], request?: NextRequest) {
  const session = await requireAuth(request);
  
  const roles = Array.isArray(role) ? role : [role];
  
  if (!roles.includes(session.user.role)) {
    throw new Error("Insufficient permissions");
  }
  
  return session;
}
// src/utils/auth.ts
// This utility file provides a helper function to get the session on the server.

// Import getServerSession from next-auth
// This function is designed for use in Server Components and API routes
import { getServerSession } from "next-auth";
// Import your authOptions from your central configuration file
import { authOptions } from "@/auth";

/**
 * Helper function to get the NextAuth session on the server side.
 * This is an alternative to importing `auth` directly in layouts/Server Components
 * and might help bypass module resolution issues.
 * @returns The current session or null if not authenticated.
 */
export async function getSession() {
  // Call getServerSession with your authOptions to get the session
  const session = await getServerSession(authOptions);
  return session;
}

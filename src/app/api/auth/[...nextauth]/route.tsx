// src/app/api/auth/[...nextauth]/route.tsx
// This file defines the API route handler for NextAuth.js
// by explicitly defining GET and POST handlers that call the imported handlers.

// Import handlers from your central auth configuration file
// Ensure that src/auth.ts correctly exports `handlers`
import { handlers } from "@/auth";

// Explicitly define the GET handler
export async function GET(req, res) {
  console.log("API Route: GET /api/auth/[...nextauth] called");
  // Call the GET handler from the imported handlers
  return handlers.GET(req, res);
}

// Explicitly define the POST handler
export async function POST(req, res) {
   console.log("API Route: POST /api/auth/[...nextauth] called");
  // Call the POST handler from the imported handlers
  return handlers.POST(req, res);
}

// Note: OPTIONS, HEAD, etc. methods are handled by NextAuth.js internally via handlers
// No need to export them explicitly unless you have custom logic for them.

// The rest of your NextAuth.js configuration should be in src/auth.ts

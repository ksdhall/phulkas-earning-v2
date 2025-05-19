// src/app/api/auth/[...nextauth]/route.tsx
import { handlers } from "@/auth"; // Assuming your auth.ts exports handlers
import { NextRequest } from 'next/server'; // Import NextRequest type

// The handlers from next-auth v5+ are designed to be used directly.
// You typically don't need to define GET/POST functions and manually call handlers.
// However, if you need to add custom logic (like logging) before calling handlers,
// you must correctly type the request parameter.

// Explicitly define the GET handler with correct type annotation
export async function GET(req: NextRequest) { // Annotate 'req' with NextRequest, remove 'res'
  console.log("API Route: GET /api/auth/[...nextauth] called");
  // Call the GET handler from the imported handlers, passing only the request
  return handlers.GET(req); // Pass only req to handlers.GET
}

// Explicitly define the POST handler with correct type annotation
export async function POST(req: NextRequest) { // Annotate 'req' with NextRequest, remove 'res'
  console.log("API Route: POST /api/auth/[...nextauth] called");
  // Call the POST handler from the imported handlers, passing only the request
  return handlers.POST(req); // Pass only req to handlers.POST
}

// You would also define other handlers like PUT, DELETE, etc., if needed
// following the same pattern:
/*
export async function PUT(req: NextRequest) {
  console.log("API Route: PUT /api/auth/[...nextauth] called");
  return handlers.PUT(req);
}

export async function DELETE(req: NextRequest) {
  console.log("API Route: DELETE /api/auth/[...nextauth] called");
  return handlers.DELETE(req);
}
*/

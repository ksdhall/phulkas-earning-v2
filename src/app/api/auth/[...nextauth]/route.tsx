// src/app/api/auth/[...nextauth]/route.tsx
// Import GET and POST directly from your configured auth.ts file
import { GET, POST } from '@/auth';

// Re-export them to define your API route handlers for Next.js App Router
// Next.js automatically calls these exported functions for the corresponding HTTP methods.
export { GET, POST };

// You can also define other handlers like PUT, DELETE, etc., if needed, similarly.

// src/app/[locale]/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth'; // Assuming your auth function is exported from auth.ts
// Import the new Client Component
import LoginPageClient from '@/components/LoginPageClient';

// This is an async Server Component
export default async function LoginPage() {
  // Check if the user is already authenticated on the server side
  const session = await auth();

  // If authenticated, redirect to the dashboard
  if (session) {
    console.log("LoginPage (Server): User authenticated, redirecting to dashboard.");
    redirect('/en/dashboard'); // Adjust the redirect path and locale as needed
  }

  console.log("LoginPage (Server): User not authenticated, rendering login form.");
  // Render the Client Component which handles the UI and client-side logic
  return <LoginPageClient />;
}

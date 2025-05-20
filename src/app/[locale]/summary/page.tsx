// src/app/[locale]/summary/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import SummaryPageClient from '@/components/SummaryPageClient'; // Import the new client component

export default async function SummaryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/en"); // Redirect unauthenticated users to the login page
  }

  // If authenticated, render the client-side summary component
  return <SummaryPageClient />;
}

// src/app/[locale]/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import DashboardPageClient from '@/components/DashboardPageClient'; // Import the new client component

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/en"); // Redirect unauthenticated users to the login page
  }

  // If authenticated, render the client-side dashboard component
  return <DashboardPageClient />;
}

// src/app/[locale]/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import DashboardPageClient from '@/components/DashboardPageClient';

interface DashboardPageProps {
  params: {
    locale: string;
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) { // Corrected: params is directly available
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${params.locale}`); // Use params.locale directly
  }

  // Render the client component, passing the locale
  return <DashboardPageClient locale={params.locale} />;
}

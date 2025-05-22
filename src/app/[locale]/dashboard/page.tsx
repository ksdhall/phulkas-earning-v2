// src/app/[locale]/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import DashboardPageClient from "@/components/DashboardPageClient";

interface DashboardPageProps {
  params: {
    locale: string;
  };
}

export default async function DashboardPage(props: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  const { locale } = await props.params; // Access locale directly

  if (!session) {
    redirect(`/${locale}`);
  }

  return <DashboardPageClient locale={locale} />;
}

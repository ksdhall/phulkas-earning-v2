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

  const currentParams = props.params; // Get params explicitly
  const currentLocale = currentParams.locale; // Access locale from the explicit params object

  if (!session) {
    redirect(`/${currentLocale}`);
  }

  return <DashboardPageClient locale={currentLocale} />;
}

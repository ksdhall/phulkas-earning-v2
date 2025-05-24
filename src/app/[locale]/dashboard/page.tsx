// src/app/[locale]/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import DashboardPageClient from "@/components/DashboardPageClient";
import { format, parseISO, isValid, subDays } from 'date-fns';
import { Bill } from '@/types/bill';
import { headers } from 'next/headers';

interface DashboardPageProps {
  params: {
    locale: string;
  };
  searchParams?: {
    date?: string;
  };
}

export default async function DashboardPage(props: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  // CRITICAL FIX: Await params and searchParams
  const { locale } = await props.params;
  const currentSearchParams = await Promise.resolve(props.searchParams || {});

  if (!session) {
    redirect(`/${locale}`);
  }

  let initialBills: Bill[] = [];
  let initialDate: string | undefined;
  let initialError: string | null = null;

  try {
    const dateParam = currentSearchParams.date;
    let targetDate: Date;

    if (dateParam && isValid(parseISO(dateParam))) {
      targetDate = parseISO(dateParam);
    } else {
      targetDate = new Date();
    }

    initialDate = format(targetDate, 'yyyy-MM-dd');

    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/${locale}/api/reports?from=${initialDate}&to=${initialDate}`;

    // CRITICAL FIX: Await headers() and forward the 'Cookie' header
    const requestHeaders = new Headers(await headers());
    const cookieHeader = requestHeaders.get('cookie');

    const fetchOptions: RequestInit = {
      cache: 'no-store',
    };

    if (cookieHeader) {
      fetchOptions.headers = { 'Cookie': cookieHeader };
    }

    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch initial bills from API.');
    }
    initialBills = await response.json();

  } catch (e: any) {
    console.error("DashboardPage (Server): Error fetching initial bills:", e);
    initialError = e.message || "Failed to load initial dashboard data.";
    initialBills = [];
  }

  return (
    <DashboardPageClient
      locale={locale}
      initialBills={initialBills}
      initialDate={initialDate}
      initialError={initialError}
    />
  );
}

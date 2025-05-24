// src/app/[locale]/summary/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import SummaryPageClient from "@/components/SummaryPageClient";
import { format, isValid, parseISO, subDays } from 'date-fns';
import { Bill } from '@/types/bill';
import { headers } from 'next/headers';

interface SummaryPageProps {
  params: {
    locale: string;
  };
  searchParams?: {
    from?: string;
    to?: string;
  };
}

export default async function SummaryPage(props: SummaryPageProps) {
  const session = await getServerSession(authOptions);

  // CRITICAL FIX: Await params and searchParams
  const { locale } = await props.params;
  const currentSearchParams = await Promise.resolve(props.searchParams || {});

  if (!session) {
    redirect(`/${locale}`);
  }

  let initialBills: Bill[] = [];
  let initialError: string | null = null;
  let initialFromDate: string | undefined;
  let initialToDate: string | undefined;

  try {
    const { from: fromParam, to: toParam } = currentSearchParams;

    let startDate: Date;
    let endDate: Date;

    if (fromParam && toParam && isValid(parseISO(fromParam)) && isValid(parseISO(toParam))) {
      startDate = parseISO(fromParam);
      endDate = parseISO(toParam);
      if (startDate > endDate) {
        throw new Error("From date cannot be after To date.");
      }
    } else {
      endDate = new Date();
      startDate = subDays(endDate, 6);
    }

    initialFromDate = format(startDate, 'yyyy-MM-dd');
    initialToDate = format(endDate, 'yyyy-MM-dd');

    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/${locale}/api/reports?from=${initialFromDate}&to=${initialToDate}`;

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
    console.error("SummaryPage (Server): Error fetching initial bills:", e);
    initialError = e.message || "Failed to load initial summary data.";
    initialBills = [];
  }

  return (
    <SummaryPageClient
      locale={locale}
      initialBills={initialBills}
      initialFromDate={initialFromDate}
      initialToDate={initialToDate}
      initialError={initialError}
    />
  );
}

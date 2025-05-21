// src/app/[locale]/summary/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import SummaryPageClient from '@/components/SummaryPageClient';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { Bill } from '@/types/Bill';

interface SummaryPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    from?: string;
    to?: string;
  };
}

export default async function SummaryPage(props: SummaryPageProps) {
  const session = await getServerSession(authOptions);

  const currentParams = props.params;         // Get params explicitly
  const currentSearchParams = props.searchParams; // Get searchParams explicitly

  const locale = currentParams.locale;       // Access locale from the explicit params object
  const from = currentSearchParams.from;     // Access from from the explicit searchParams object
  const to = currentSearchParams.to;         // Access to from the explicit searchParams object

  if (!session) {
    redirect(`/${locale}`);
  }

  let bills: Bill[] = [];
  let error: string | null = null;
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  try {
    if (from && to) {
      fromDate = new Date(from);
      toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error("Invalid date format. Please use Букмекерлар-MM-DD.");
      }
      if (fromDate > toDate) {
        throw new Error("From date cannot be after To date.");
      }

      const adjustedToDate = new Date(toDate);
      adjustedToDate.setDate(adjustedToDate.getDate() + 1);

      const fetchedBills = await prisma.bill.findMany({
        where: {
          date: {
            gte: fromDate,
            lt: adjustedToDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      bills = fetchedBills.map(bill => ({
        ...bill,
        date: format(bill.date, 'yyyy-MM-dd'),
        mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: bill.isOurFood ?? true,
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));

    } else {
      const defaultToDate = new Date();
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 6);

      fromDate = defaultFromDate;
      toDate = defaultToDate;

      const adjustedDefaultToDate = new Date(defaultToDate);
      adjustedDefaultToDate.setDate(adjustedDefaultToDate.getDate() + 1);

      const fetchedBills = await prisma.bill.findMany({
        where: {
          date: {
            gte: defaultFromDate,
            lt: adjustedDefaultToDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      bills = fetchedBills.map(bill => ({
        ...bill,
        date: format(bill.date, 'yyyy-MM-dd'),
        mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
        isOurFood: bill.isOurFood ?? true,
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      }));
    }
  } catch (e: any) {
    console.error("Error fetching bills for summary:", e);
    error = e.message || "Failed to fetch summary data.";
    bills = [];
  }

  return (
    <SummaryPageClient
      locale={locale}
      initialBills={bills}
      initialFromDate={fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined}
      initialToDate={toDate ? format(toDate, 'yyyy-MM-dd') : undefined}
      initialError={error}
    />
  );
}

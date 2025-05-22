// src/app/[locale]/summary/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import SummaryPageClient from "@/components/SummaryPageClient";
import prisma from '@/lib/prisma';
import { format, isValid } from 'date-fns';

// Define the Bill type to match Prisma's output and what calculations.ts expects
interface Bill {
  id: string;
  date: string; // ISO string 'yyyy-MM-dd'
  foodAmount: number; // Now explicitly foodAmount
  drinkAmount: number; // Now explicitly drinkAmount
  mealType: 'lunch' | 'dinner';
  isOurFood: boolean;
  numberOfPeopleWorkingDinner: number;
  comments?: string | null;
}

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

  const { locale } = await Promise.resolve(props.params);
  const currentSearchParams = await Promise.resolve(props.searchParams || {});

  if (!session) {
    redirect(`/${locale}`);
  }

  let bills: Bill[] = [];
  let error: string | null = null;
  let fromDate: Date | null = null;
  let toDate: Date | null = null;

  try {
    const fromParam = currentSearchParams.from;
    const toParam = currentSearchParams.to;

    // Determine date range for fetching
    if (fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);

      if (isNaN(fromDate.getTime()) || !isValid(fromDate) || isNaN(toDate.getTime()) || !isValid(toDate)) {
        throw new Error("Invalid date format in URL parameters. Please use Букмекерлар-MM-DD.");
      }
      if (fromDate > toDate) {
        throw new Error("From date cannot be after To date.");
      }

      const adjustedToDate = new Date(toDate);
      adjustedToDate.setDate(adjustedToDate.getDate() + 1);

      const fetchedBillsRaw = await prisma.bill.findMany({
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

      bills = fetchedBillsRaw.map(bill => {
        // Ensure foodAmount and drinkAmount are numbers
        const foodAmountNum = typeof bill.foodAmount === 'string'
          ? parseFloat(bill.foodAmount)
          : Number(bill.foodAmount);
        const drinkAmountNum = typeof bill.drinkAmount === 'string'
          ? parseFloat(bill.drinkAmount)
          : Number(bill.drinkAmount);

        if (isNaN(foodAmountNum) || isNaN(drinkAmountNum)) {
          console.error('SummaryPage (Server): NaN amount detected for bill:', bill);
          throw new Error('Invalid foodAmount or drinkAmount found in bill data.');
        }

        return {
          id: bill.id,
          date: format(bill.date, 'yyyy-MM-dd'),
          mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
          foodAmount: foodAmountNum, // Pass foodAmount directly
          drinkAmount: drinkAmountNum, // Pass drinkAmount directly
          isOurFood: bill.isOurFood ?? true,
          numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
          comments: bill.comments ?? null,
        };
      });

    } else {
      // Default date range (e.g., last 7 days) if no search params are provided
      const defaultToDate = new Date();
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 6);

      fromDate = defaultFromDate;
      toDate = defaultToDate;

      const adjustedDefaultToDate = new Date(defaultToDate);
      adjustedDefaultToDate.setDate(adjustedDefaultToDate.getDate() + 1);

      const fetchedBillsRaw = await prisma.bill.findMany({
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

      bills = fetchedBillsRaw.map(bill => {
        const foodAmountNum = typeof bill.foodAmount === 'string'
          ? parseFloat(bill.foodAmount)
          : Number(bill.foodAmount);
        const drinkAmountNum = typeof bill.drinkAmount === 'string'
          ? parseFloat(bill.drinkAmount)
          : Number(bill.drinkAmount);

        if (isNaN(foodAmountNum) || isNaN(drinkAmountNum)) {
          console.error('SummaryPage (Server): NaN amount detected for default bill:', bill);
          throw new Error('Invalid foodAmount or drinkAmount found in default bill data.');
        }

        return {
          id: bill.id,
          date: format(bill.date, 'yyyy-MM-dd'),
          mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
          foodAmount: foodAmountNum,
          drinkAmount: drinkAmountNum,
          isOurFood: bill.isOurFood ?? true,
          numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
          comments: bill.comments ?? null,
        };
      });
    }
  } catch (e: any) {
    console.error("SummaryPage (Server): Error fetching or processing bills:", e);
    error = e.message || "Failed to fetch summary data.";
    bills = []; // Ensure bills is empty on error
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

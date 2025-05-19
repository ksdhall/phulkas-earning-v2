// src/app/[locale]/api/reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
// Assuming 'prisma' is a named export from '@/lib/prisma'
import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/auth';

// Import calculation functions
import { calculateRangeSummary } from '@/lib/calculations';

// Import the Bill interface and MealType enum from Prisma client
import { Bill } from '@/types/Bill'; // Assuming Bill interface is here
import { MealType } from '@prisma/client'; // Import MealType enum

// Handler for GET requests to fetch reports based on date range
export async function GET(request: NextRequest) {
  try {
    // Authentication check (optional but recommended)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    if (!fromDateStr || !toDateStr) {
      return NextResponse.json({ error: 'Missing date range parameters' }, { status: 400 });
    }

    // Parse dates and set time to start/end of day in UTC
    // This ensures the range includes the entire day for both start and end dates
    const fromDate = new Date(fromDateStr);
    fromDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

    const toDate = new Date(toDateStr);
    toDate.setUTCHours(23, 59, 59, 999); // End of the day in UTC


     console.log(`API Reports: Querying bills between: ${fromDate.toISOString()} and ${toDate.toISOString()}`);


    // Fetch bills within the specified date range
    const billsFromPrisma = await prisma.bill.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
          date: 'desc', // Order by date descending
      },
    });

     console.log(`API Reports: Fetched bills count: ${billsFromPrisma.length}`);

    // Map the Prisma results to match the client-side Bill interface
    // Specifically convert MealType enum to lowercase string literal
    const processedBills: Bill[] = billsFromPrisma.map(bill => ({
        ...bill,
        // Convert MealType enum ('LUNCH'/'DINNER') to lowercase string ('lunch'/'dinner')
        mealType: bill.mealType.toString().toLowerCase() as "lunch" | "dinner",
         // Ensure isOurFood is boolean, default to true if null/undefined from db
        isOurFood: bill.isOurFood ?? true,
         // Ensure numberOfPeopleWorkingDinner is number, default to 1 if null/undefined from db
        numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
    }));


    // Calculate the summary using the processed bills
    const summary = calculateRangeSummary(processedBills);

    // Return both the original bills (or processed bills, depending on what the client expects) and the summary
    // Returning processedBills ensures consistency with client-side handling
    return NextResponse.json({ bills: processedBills, summary });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

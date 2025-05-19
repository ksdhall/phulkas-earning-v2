// src/app/[locale]/api/reports/route.ts
import { NextResponse, NextRequest } from 'next/server';
// Assuming 'prisma' is a named export from '@/lib/prisma'
import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/auth';

// Import calculation functions
import { calculateRangeSummary } from '@/lib/calculations';

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
    const bills = await prisma.bill.findMany({
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

     console.log(`API Reports: Fetched bills count: ${bills.length}`);

    // Calculate the summary for the fetched bills
    const summary = calculateRangeSummary(bills);

    // Return both the bills and the summary
    return NextResponse.json({ bills, summary });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

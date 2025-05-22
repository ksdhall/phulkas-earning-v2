// src/app/[locale]/api/reports/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { parseISO, isValid } from 'date-fns';

// Define the type for the request parameters
interface RouteParams {
  params: {
    locale: string; // The locale from the URL path
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The locale can be accessed from params.locale if needed for filtering/logging
  const { locale } = params; 
  // console.log(`API: Fetching reports for locale: ${locale}`); // Optional: for debugging

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  // Robust date parsing
  if (fromParam) {
    const parsed = parseISO(fromParam);
    if (isValid(parsed)) {
      fromDate = parsed;
    } else {
      console.error(`API: Invalid 'from' date parameter for locale ${locale}: ${fromParam}`);
      return NextResponse.json({ error: 'Invalid "from" date format' }, { status: 400 });
    }
  }

  if (toParam) {
    const parsed = parseISO(toParam);
    if (isValid(parsed)) {
      // For 'to' date, adjust to include the entire day
      toDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + 1);
    } else {
      console.error(`API: Invalid 'to' date parameter for locale ${locale}: ${toParam}`);
      return NextResponse.json({ error: 'Invalid "to" date format' }, { status: 400 });
    }
  }

  if (!fromDate || !toDate) {
    return NextResponse.json({ error: 'Both "from" and "to" dates are required and must be valid.' }, { status: 400 });
  }

  try {
    const bills = await prisma.bill.findMany({
      where: {
        date: {
          gte: fromDate,
          lt: toDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Ensure amounts are numbers before sending to client
    const safeBills = bills.map(bill => ({
      ...bill,
      foodAmount: typeof bill.foodAmount === 'string' ? parseFloat(bill.foodAmount) : Number(bill.foodAmount),
      drinkAmount: typeof bill.drinkAmount === 'string' ? parseFloat(bill.drinkAmount) : Number(bill.drinkAmount),
    }));

    return NextResponse.json({ bills: safeBills });
  } catch (error) {
    console.error(`API Error fetching bills for locale ${locale}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

// src/app/[locale]/api/reports/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { parseISO, isValid, addDays } from 'date-fns';

interface RouteParams {
  params: {
    locale: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL FIX: Await params before destructuring
  const { locale } = await params;

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (fromParam) {
    const parsed = parseISO(fromParam);
    if (isValid(parsed)) {
      fromDate = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0));
    } else {
      console.error(`API: Invalid 'from' date parameter for locale ${locale}: ${fromParam}`);
      return NextResponse.json({ error: 'Invalid "from" date format' }, { status: 400 });
    }
  }

  if (toParam) {
    const parsed = parseISO(toParam);
    if (isValid(parsed)) {
      toDate = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + 1, 0, 0, 0, 0));
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

    const safeBills = bills.map(bill => ({
      ...bill,
      foodAmount: Number(bill.foodAmount),
      drinkAmount: Number(bill.drinkAmount),
      mealType: bill.mealType.toString().toLowerCase() as 'lunch' | 'dinner',
      isOurFood: bill.isOurFood ?? true,
      numberOfPeopleWorkingDinner: bill.numberOfPeopleWorkingDinner ?? 1,
      id: bill.id.toString(),
      comments: bill.comments ?? '',
    }));

    return NextResponse.json(safeBills);
  } catch (error) {
    console.error(`API Error fetching bills for locale ${locale}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

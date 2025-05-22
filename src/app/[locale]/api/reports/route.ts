// src/app/[locale]/api/reports/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseISO } from 'date-fns';

export async function GET(request: Request, { params }: { params: { locale: string } }) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing "from" or "to" date parameters' }, { status: 400 });
  }

  try {
    const fromDate = parseISO(from);
    const toDate = new Date(parseISO(to).setHours(23, 59, 59, 999));

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format provided. Use YYYY-MM-DD.' }, { status: 400 });
    }

    const bills = await prisma.bill.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error('API Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports', details: error.message }, { status: 500 });
  }
}

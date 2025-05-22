// src/app/[locale]/api/purchase-bills/by-date/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const startOfDay = new Date(dateParam);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateParam);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const purchaseBills = await prisma.purchaseBill.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(purchaseBills, { status: 200 });
  } catch (error) {
    console.error('API Error fetching purchase bills by date:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase bills' }, { status: 500 });
  }
}

// src/app/[locale]/api/purchase-bills/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { format, parseISO, isValid } from 'date-fns';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, amount, description, comments } = body;

    if (!date || amount === undefined || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPurchaseBill = await prisma.purchaseBill.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        description,
        comments,
      },
    });

    return NextResponse.json(newPurchaseBill, { status: 201 });
  } catch (error) {
    console.error('API Error creating purchase bill:', error);
    return NextResponse.json({ error: 'Failed to create purchase bill' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let whereClause: any = {};

  if (fromParam && isValid(parseISO(fromParam))) {
    const fromDate = parseISO(fromParam);
    fromDate.setUTCHours(0, 0, 0, 0);
    whereClause.date = { gte: fromDate };
  }

  if (toParam && isValid(parseISO(toParam))) {
    const toDate = parseISO(toParam);
    toDate.setUTCHours(23, 59, 59, 999);
    whereClause.date = { ...whereClause.date, lte: toDate };
  }

  try {
    const purchaseBills = await prisma.purchaseBill.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
    });
    return NextResponse.json(purchaseBills, { status: 200 });
  } catch (error) {
    console.error('API Error fetching purchase bills:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase bills' }, { status: 500 });
  }
}

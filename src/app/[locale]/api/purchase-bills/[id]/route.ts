// src/app/[locale]/api/purchase-bills/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET a single Purchase Bill by ID
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const purchaseBill = await prisma.purchaseBill.findUnique({
      where: {
        id: parseInt(id), // Assuming ID is an integer
      },
    });

    if (!purchaseBill) {
      return NextResponse.json({ error: 'Purchase bill not found' }, { status: 404 });
    }

    return NextResponse.json(purchaseBill, { status: 200 });
  } catch (error) {
    console.error(`API Error fetching purchase bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch purchase bill' }, { status: 500 });
  }
}

// PUT (Update) a Purchase Bill by ID
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { date, amount, description, comments } = body;

    if (!date || amount === undefined || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedPurchaseBill = await prisma.purchaseBill.update({
      where: {
        id: parseInt(id),
      },
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        description,
        comments,
      },
    });

    return NextResponse.json(updatedPurchaseBill, { status: 200 });
  } catch (error) {
    console.error(`API Error updating purchase bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update purchase bill' }, { status: 500 });
  }
}

// DELETE a Purchase Bill by ID
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.purchaseBill.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({ message: 'Purchase bill deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`API Error deleting purchase bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete purchase bill' }, { status: 500 });
  }
}

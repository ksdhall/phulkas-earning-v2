// src/app/[locale]/api/bills/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { MealType } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { date, foodAmount, drinkAmount, mealType, isOurFood, numberOfPeopleWorkingDinner, comments } = body;

    if (!date || foodAmount === undefined || drinkAmount === undefined || !mealType || isOurFood === undefined || numberOfPeopleWorkingDinner === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prismaMealType = mealType.toUpperCase() as MealType;

    const updatedBill = await prisma.bill.update({
      where: {
        id: parseInt(id),
      },
      data: {
        date: new Date(date),
        foodAmount: parseFloat(foodAmount),
        drinkAmount: parseFloat(drinkAmount),
        mealType: prismaMealType,
        isOurFood: isOurFood,
        numberOfPeopleWorkingDinner: numberOfPeopleWorkingDinner,
        comments: comments,
      },
    });

    return NextResponse.json(updatedBill, { status: 200 });
  } catch (error) {
    console.error(`API Error updating bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const bill = await prisma.bill.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill, { status: 200 });
  } catch (error) {
    console.error(`API Error fetching bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.bill.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({ message: 'Bill deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`API Error deleting bill with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}

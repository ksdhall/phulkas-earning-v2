// src/app/[locale]/api/bills/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { MealType } from '@prisma/client';
import { format } from 'date-fns';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, foodAmount, drinkAmount, mealType, isOurFood, numberOfPeopleWorkingDinner, comments } = body;

    if (!date || foodAmount === undefined || drinkAmount === undefined || !mealType || isOurFood === undefined || numberOfPeopleWorkingDinner === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prismaMealType = mealType.toUpperCase() as MealType;

    const newBill = await prisma.bill.create({
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

    return NextResponse.json({
      ...newBill,
      id: newBill.id.toString(), // Ensure ID is string
      date: format(newBill.date, 'yyyy-MM-dd'), // Ensure date is formatted
      mealType: newBill.mealType.toString().toLowerCase(), // Ensure mealType is lowercase
      isOurFood: newBill.isOurFood ?? true,
      numberOfPeopleWorkingDinner: newBill.numberOfPeopleWorkingDinner ?? 1,
      comments: newBill.comments ?? null,
    }, { status: 201 });
  } catch (error) {
    console.error('API Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

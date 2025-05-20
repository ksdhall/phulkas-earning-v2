// src/app/api/bills/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma namespace

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params; // Corrected: params is directly available
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json(bill);
  } catch (error: any) {
    console.error(`API Error fetching bill ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch bill', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params; // Corrected: params is directly available
  try {
    const body = await request.json();
    const { date, mealType, foodAmount, drinkAmount, isOurFood, numberOfPeopleWorkingDinner } = body;

    const parsedFoodAmount = parseFloat(foodAmount as string) || 0;
    const parsedDrinkAmount = parseFloat(drinkAmount as string) || 0;
    const parsedNumPeople = parseInt(numberOfPeopleWorkingDinner as string) || 1;

    // Convert mealType string to Prisma Enum
    const prismaMealType = mealType.toUpperCase() as Prisma.MealType;

    const updatedBill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(date),
        mealType: prismaMealType,
        foodAmount: parsedFoodAmount,
        drinkAmount: parsedDrinkAmount,
        isOurFood: isOurFood ?? true,
        numberOfPeopleWorkingDinner: parsedNumPeople,
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error(`API Error updating bill ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Bill not found for update' }, { status: 404 });
      } else if (error.message.includes('Invalid value for argument `mealType`')) {
        return NextResponse.json({ error: 'Invalid meal type provided. Expected "LUNCH" or "DINNER".' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to update bill', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params; // Corrected: params is directly available
  try {
    await prisma.bill.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Bill deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`API Error deleting bill ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Bill not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete bill', details: error.message }, { status: 500 });
  }
}

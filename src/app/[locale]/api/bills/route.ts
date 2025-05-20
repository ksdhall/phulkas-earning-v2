// src/app/api/bills/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Import Prisma namespace for enums

// GET handler for fetching all bills (optional, but good to have)
export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: {
        date: 'desc', // Order by date descending
      },
    });
    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error('API Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills', details: error.message }, { status: 500 });
  }
}

// POST handler for creating a new bill
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, mealType, foodAmount, drinkAmount, isOurFood, numberOfPeopleWorkingDinner } = body;

    // Basic validation (more robust validation should be done on client and server)
    if (!date || !mealType || foodAmount === undefined || drinkAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure numeric values are actually numbers, default to 0 if empty string from form
    const parsedFoodAmount = parseFloat(foodAmount) || 0;
    const parsedDrinkAmount = parseFloat(drinkAmount) || 0;
    const parsedNumPeople = parseInt(numberOfPeopleWorkingDinner) || 1; // Default to 1

    // Convert mealType string to Prisma Enum
    const prismaMealType = mealType.toUpperCase() as Prisma.MealType; // Assuming enum values are LUNCH, DINNER

    const newBill = await prisma.bill.create({
      data: {
        date: new Date(date), // Convert date string to Date object
        mealType: prismaMealType, // Use the converted Prisma Enum
        foodAmount: parsedFoodAmount,
        drinkAmount: parsedDrinkAmount,
        isOurFood: isOurFood ?? true, // Default to true if not provided
        numberOfPeopleWorkingDinner: parsedNumPeople,
      },
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error: any) {
    console.error('API Error creating bill:', error);
    let errorMessage = 'Failed to create bill';
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        errorMessage = 'A bill with these details already exists (unique constraint violation).';
      } else if (error.message.includes('Invalid `date` value')) {
        errorMessage = 'Invalid date format provided.';
      } else if (error.message.includes('Invalid value for argument `mealType`')) {
        errorMessage = 'Invalid meal type provided. Expected "LUNCH" or "DINNER".';
      }
    } else {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}

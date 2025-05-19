// src/app/[locale]/api/bills/route.ts
import { NextResponse, NextRequest } from 'next/server';
// Assuming 'prisma' is a named export from '@/lib/prisma'
import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/auth';

// Handler for POST requests to create a new bill
export async function POST(request: NextRequest) {
  try {
    // Authentication check (optional but recommended)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Basic validation (add more robust validation as needed)
    if (typeof body.date !== 'string' || typeof body.mealType !== 'string' || typeof body.foodAmount !== 'number' || typeof body.drinkAmount !== 'number') {
        return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Ensure mealType matches Prisma enum or expected values ('LUNCH', 'DINNER')
    // Convert to uppercase if your Prisma schema uses uppercase enums
    const mealType = body.mealType.toUpperCase();
    if (mealType !== 'LUNCH' && mealType !== 'DINNER') {
         return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 });
    }

     // Optional fields with default values
     const isOurFood = body.isOurFood ?? true; // Default to true if not provided
     const numberOfPeopleWorkingDinner = body.numberOfPeopleWorkingDinner ?? 1; // Default to 1 if not provided, ensure it's a number

     // Validate numberOfPeopleWorkingDinner if mealType is DINNER
     if (mealType === 'DINNER' && (typeof numberOfPeopleWorkingDinner !== 'number' || numberOfPeopleWorkingDinner <= 0)) {
          // If mealType is DINNER, numberOfPeopleWorkingDinner must be a positive number
          return NextResponse.json({ error: 'Invalid number of people working for dinner' }, { status: 400 });
     }


    const newBill = await prisma.bill.create({
      data: {
        date: new Date(body.date), // Ensure date is a Date object
        mealType: mealType as 'LUNCH' | 'DINNER', // Cast to Prisma enum type
        foodAmount: body.foodAmount,
        drinkAmount: body.drinkAmount,
        isOurFood: isOurFood, // Include isOurFood
        numberOfPeopleWorkingDinner: numberOfPeopleWorkingDinner, // Include numberOfPeopleWorkingDinner
      },
    });

    return NextResponse.json(newBill, { status: 201 });

  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

// Handler for GET requests to fetch all bills (optional, but useful)
// export async function GET(request: NextRequest) {
//   try {
//      const session = await getSession();
//      if (!session) {
//        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//      }
//
//     const bills = await prisma.bill.findMany();
//     return NextResponse.json(bills);
//   } catch (error) {
//     console.error('Error fetching bills:', error);
//     return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
//   }
// }

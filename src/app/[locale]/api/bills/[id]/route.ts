// src/app/[locale]/api/bills/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
// Assuming 'prisma' is a named export from '@/lib/prisma'
import { prisma } from '@/lib/prisma';
import { getSession } from '@/utils/auth';

// Define the type for the context object with dynamic params
interface RouteParams {
  id: string;
}

// Handler for GET requests to fetch a single bill by ID
export async function GET(
  request: NextRequest,
  context: { params: RouteParams } // Standard type definition for dynamic params
): Promise<NextResponse> {
  try {
    // Authentication check (optional but recommended)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = parseInt(context.params.id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid Bill ID' }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);

  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

// Handler for PUT requests to update a bill by ID
export async function PUT(
  request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = parseInt(context.params.id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid Bill ID' }, { status: 400 });
    }

    const body = await request.json();

    // Basic validation for update data
    // Only include fields in `data` that are provided in the request body
    const updateData: any = {};
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.mealType !== undefined) updateData.mealType = body.mealType.toUpperCase();
    if (body.foodAmount !== undefined) updateData.foodAmount = body.foodAmount;
    if (body.drinkAmount !== undefined) updateData.drinkAmount = body.drinkAmount;
    if (body.isOurFood !== undefined) updateData.isOurFood = body.isOurFood;
    if (body.numberOfPeopleWorkingDinner !== undefined) updateData.numberOfPeopleWorkingDinner = body.numberOfPeopleWorkingDinner;


     // Validate numberOfPeopleWorkingDinner if mealType is present and is DINNER
     if (updateData.mealType === 'DINNER' && (typeof updateData.numberOfPeopleWorkingDinner !== 'number' || updateData.numberOfPeopleWorkingDinner <= 0)) {
          // If mealType is explicitly set to DINNER, numberOfPeopleWorkingDinner must be a positive number
           return NextResponse.json({ error: 'Invalid number of people working for dinner' }, { status: 400 });
     }


    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: updateData,
    });

    return NextResponse.json(updatedBill);

  } catch (error) {
    console.error('Error updating bill:', error);
    // Check if the error is due to record not found
     if (error instanceof Error && error.message.includes('Record to update not found')) {
          return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
     }
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

// Handler for DELETE requests to delete a bill by ID
export async function DELETE(
  request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const billId = parseInt(context.params.id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid Bill ID' }, { status: 400 });
    }

    await prisma.bill.delete({
      where: { id: billId },
    });

    return NextResponse.json({ message: 'Bill deleted successfully' });

  } catch (error) {
    console.error('Error deleting bill:', error);
    // Check if the error is due to record not found
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
         return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}

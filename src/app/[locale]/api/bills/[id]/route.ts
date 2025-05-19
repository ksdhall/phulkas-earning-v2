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

// You will also need handlers for PUT (Update) and DELETE requests in this file
/*
export async function DELETE(
  request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
    // ... your delete logic here
}
*/

/*
export async function PUT(
  request: NextRequest,
  context: { params: RouteParams }
): Promise<NextResponse> {
    // ... your update logic here
}
*/

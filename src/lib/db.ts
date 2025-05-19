// src/lib/db.ts
import { PrismaClient, MealType } from '@prisma/client'; // Import MealType enum from Prisma
import { BillFormData } from '@/components/BillForm'; // Assuming BillFormData is defined here or adjust path

// Instantiate PrismaClient
const prisma = new PrismaClient();

// Define the type for Bill data retrieved from Prisma
// This should match your Prisma schema Bill model
export interface Bill {
  id: number;
  date: Date; // Prisma typically returns Date objects for datetime fields
  mealType: MealType; // Use the imported MealType enum type
  foodAmount: number;
  drinkAmount: number;
  isOurFood: boolean | null; // Assuming nullable boolean in DB for dinner-specific field
  numberOfPeopleWorkingDinner: number | null; // Assuming nullable int in DB for dinner-specific field
  createdAt: Date;
  updatedAt: Date;
}


// Function to create a new bill
export const createBill = async (data: BillFormData): Promise<Bill> => {
  console.log("DB: Attempting to create bill with data:", data);
  try {
    const newBill = await prisma.bill.create({
      data: {
        date: new Date(data.date), // Ensure date is a Date object
        // Convert lowercase string to uppercase MealType enum value
        mealType: data.mealType.toUpperCase() as MealType,
        foodAmount: data.foodAmount,
        drinkAmount: data.drinkAmount,
        // Map dinner-specific fields only if mealType is 'dinner'
        isOurFood: data.mealType === 'dinner' ? data.isOurFood ?? null : null,
        numberOfPeopleWorkingDinner: data.mealType === 'dinner' ? data.numberOfPeopleWorkingDinner ?? null : null,
      },
    });
    console.log("DB: Bill created (Prisma):", newBill);
    // Cast the result to your application's Bill type if necessary,
    // assuming it aligns with the Prisma model structure
    return newBill as Bill;
  } catch (error) {
    console.error("DB: Error creating bill:", error);
    throw new Error("Failed to create bill.");
  }
};

// Function to get all bills within a date range
export const getBillsByDateRange = async (fromDate: string, toDate: string): Promise<Bill[]> => {
   console.log(`DB: Fetching bills from ${fromDate} to ${toDate}`);
  try {
    // Parse date strings to Date objects for comparison
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const bills = await prisma.bill.findMany({
      where: {
        date: {
          gte: startDate, // Greater than or equal to start date
          lte: endDate,   // Less than or equal to end date
        },
      },
       orderBy: {
           date: 'desc', // Order by date descending
       },
    });
    console.log(`DB: Found ${bills.length} bills for range.`);
    // Cast the results to your application's Bill type
    return bills as Bill[];
  } catch (error) {
    console.error("DB: Error fetching bills:", error);
    throw new Error("Failed to fetch bills.");
  }
};

// Function to get a single bill by ID
export const getBillById = async (id: number): Promise<Bill | null> => {
    console.log(`DB: Fetching bill with ID: ${id}`);
    try {
        const bill = await prisma.bill.findUnique({
            where: {
                id: id,
            },
        });
         console.log(`DB: Found bill with ID ${id}:`, bill);
         // Cast the result to your application's Bill type
        return bill as Bill | null;
    } catch (error) {
        console.error(`DB: Error fetching bill with ID ${id}:`, error);
        throw new Error(`Failed to fetch bill with ID ${id}.`);
    }
};

// Function to update an existing bill
export const updateBill = async (id: number, data: BillFormData): Promise<Bill> => {
    console.log(`DB: Attempting to update bill with ID ${id} with data:`, data);
    try {
        const updatedBill = await prisma.bill.update({
            where: {
                id: id,
            },
            data: {
                date: new Date(data.date), // Ensure date is a Date object
                // Convert lowercase string to uppercase MealType enum value
                mealType: data.mealType.toUpperCase() as MealType,
                foodAmount: data.foodAmount,
                drinkAmount: data.drinkAmount,
                 // Map dinner-specific fields only if mealType is 'dinner'
                isOurFood: data.mealType === 'dinner' ? data.isOurFood ?? null : null,
                numberOfPeopleWorkingDinner: data.mealType === 'dinner' ? data.numberOfPeopleWorkingDinner ?? null : null,
            },
        });
        console.log("DB: Bill updated (Prisma):", updatedBill);
        // Cast the result to your application's Bill type
        return updatedBill as Bill;
    } catch (error) {
        console.error(`DB: Error updating bill with ID ${id}:`, error);
        throw new Error(`Failed to update bill with ID ${id}.`);
    }
};

// Function to delete a bill by ID
export const deleteBill = async (id: number): Promise<Bill> => {
    console.log(`DB: Attempting to delete bill with ID: ${id}`);
    try {
        const deletedBill = await prisma.bill.delete({
            where: {
                id: id,
            },
        });
         console.log("DB: Bill deleted (Prisma):", deletedBill);
         // Cast the result to your application's Bill type
        return deletedBill as Bill;
    } catch (error) {
        console.error(`DB: Error deleting bill with ID ${id}:`, error);
        throw new Error(`Failed to delete bill with ID ${id}.`);
    }
};

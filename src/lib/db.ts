// src/lib/db.ts
// This file contains the functions for interacting with your database using Prisma.

import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, parseISO } from 'date-fns'; // Using date-fns for date handling

// Declare a global variable for PrismaClient in development to prevent multiple instances
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize PrismaClient. Use the global instance in development.
const prisma = global.prisma || new PrismaClient();

// In development, assign the PrismaClient instance to the global variable
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Define the shape of the Bill data expected by the functions
interface BillData {
  date: string; // Expect ISO string from frontend/API
  foodAmount: number;
  drinkAmount: number;
  isLunch: boolean;
}

// Define the shape of the Bill data returned from Prisma (includes ID)
interface Bill {
  id: number;
  date: Date; // Prisma typically returns Date objects
  foodAmount: number;
  drinkAmount: number;
  isLunch: boolean;
}


// --- Function to create a new bill using Prisma ---
export const createBill = async (data: BillData): Promise<Bill> => {
  console.log("DB: createBill called with data:", data);
  try {
    // Create a new bill record in the database using Prisma client
    const newBill = await prisma.bill.create({
      data: {
        // Convert the date string to a Date object for Prisma
        date: parseISO(data.date),
        foodAmount: data.foodAmount,
        drinkAmount: data.drinkAmount,
        isLunch: data.isLunch,
      },
    });
    console.log("DB: Bill created (Prisma):", newBill);
    return newBill; // Return the created bill
  } catch (error) {
    console.error("DB: Error creating bill (Prisma):", error);
    throw error; // Re-throw the error to be handled by the API route
  }
};


// --- Function to get a bill by ID using Prisma ---
export const getBillById = async (id: number): Promise<Bill | null> => {
  console.log("DB: getBillById called with ID:", id);
  try {
    // Find a unique bill record by its ID using Prisma client
    const bill = await prisma.bill.findUnique({
      where: {
        id: id, // Prisma expects the ID to match the type defined in schema (likely Int)
      },
    });
    console.log("DB: Bill found (Prisma):", bill);
    return bill; // Return the found bill or null if not found
  } catch (error) {
    console.error("DB: Error getting bill by ID (Prisma):", error);
    throw error; // Re-throw the error
  }
};

// --- Function to update a bill using Prisma ---
export const updateBill = async (id: number, data: Partial<BillData>): Promise<Bill | null> => {
  console.log("DB: updateBill called with ID:", id, "and data:", data);
  try {
      // Prepare update data, converting date string to Date if present
      const updateData: any = { ...data };
      if (data.date && typeof data.date === 'string') {
          updateData.date = parseISO(data.date);
      }

    // Update a bill record by its ID using Prisma client
    const updatedBill = await prisma.bill.update({
      where: {
        id: id, // Prisma expects the ID to match the type defined in schema
      },
      data: updateData, // Pass the prepared update data
    });
    console.log("DB: Bill updated (Prisma):", updatedBill);
    return updatedBill; // Return the updated bill
  } catch (error) {
    console.error("DB: Error updating bill (Prisma):", error);
    throw error; // Re-throw the error
  }
};

// --- Function to delete a bill using Prisma ---
export const deleteBill = async (id: number): Promise<Bill | null> => {
  console.log("DB: deleteBill called with ID:", id);
  try {
    // Delete a bill record by its ID using Prisma client
    const deletedBill = await prisma.bill.delete({
      where: {
        id: id, // Prisma expects the ID to match the type defined in schema
      },
    });
    console.log("DB: Bill deleted (Prisma):", deletedBill);
    return deletedBill; // Return the deleted bill
  } catch (error) {
    // Handle case where bill is not found for deletion gracefully
    if ((error as any).code === 'P2025') { // Prisma error code for "An operation failed because it depends on one or more records that were required but not found."
        console.log("DB: Bill not found for deletion (Prisma).");
        return null;
    }
    console.error("DB: Error deleting bill (Prisma):", error);
    throw error; // Re-throw other errors
  }
};

// --- Function to get bills by date range or single date using Prisma ---
export const getBillsByDateRange = async (fromDate?: string, toDate?: string, date?: string): Promise<Bill[]> => {
    console.log("DB: getBillsByDateRange called with fromDate:", fromDate, "toDate:", toDate, "date:", date);
    try {
        let whereClause: any = {};

        if (date) {
            // Filter for a single specific date
            const targetDate = parseISO(date);
            // Use date-fns to get the start and end of the day in the local timezone
            const start = startOfDay(targetDate);
            const end = endOfDay(targetDate);

            whereClause = {
                date: {
                    gte: start, // Greater than or equal to the start of the day
                    lte: end,   // Less than or equal to the end of the day
                },
            };

        } else if (fromDate && toDate) {
            // Filter for a date range
            const startDate = parseISO(fromDate);
            const endDate = parseISO(toDate);

             // Use date-fns to get the start of the start date and end of the end date
            const start = startOfDay(startDate);
            const end = endOfDay(endDate);

            whereClause = {
                date: {
                    gte: start, // Greater than or equal to the start date
                    lte: end,   // Less than or equal to the end date
                },
            };
        } else {
             // If no date or range is specified, maybe return all or handle as an error
             // For now, let's return an empty array or handle as needed.
             console.log("DB: getBillsByDateRange called without date or range.");
             return []; // Return empty array if no filter provided
        }

        // Find bills based on the where clause, ordered by date descending
        const bills = await prisma.bill.findMany({
            where: whereClause,
            orderBy: {
                date: 'desc', // Order by date descending (newest first)
            },
        });

        console.log("DB: Bills found (Prisma):", bills);
        return bills; // Return the found bills

    } catch (error) {
        console.error("DB: Error getting bills by date range (Prisma):", error);
        throw error; // Re-throw the error
    }
};

// Export the prisma client instance
export default prisma;

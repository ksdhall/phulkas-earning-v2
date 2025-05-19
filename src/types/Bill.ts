// src/types/Bill.ts
// Defines the structure for a single bill entry.

// Import MealType Enum from Prisma client
// This is needed here because the Bill interface uses it.
// Make sure you have run 'npx prisma generate' after your last migration.
import { MealType } from '@prisma/client';


export interface Bill {
  id: number;
  date: string | Date; // Can be string from API or Date object
  foodAmount: number;
  drinkAmount: number;
  // Changed from isLunch: boolean to mealType: 'lunch' | 'dinner' (string representation for client)
  // Note: In Prisma schema, it's the MealType Enum. We'll map it in API/fetch.
  mealType: 'lunch' | 'dinner';

  // Added for dinner food calculation
  // True if the food sold was 'ours' during dinner. Optional, defaults to true if not specified.
  isOurFood?: boolean;

  // Added for dinner food calculation shift share. Optional, defaults to 1 if not specified.
  // Only relevant when mealType is DINNER.
  numberOfPeopleWorkingDinner?: number | null; // Can be null from DB
}

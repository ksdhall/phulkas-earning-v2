// src/lib/calculations.ts
// This file contains functions for calculating earnings summaries.

// Import the Bill interface
import { Bill } from '@/types/Bill'; // Assuming Bill interface is here

// Import MealType Enum directly from Prisma client
import { MealType } from '@prisma/client';

// --- Export the DailyEarningsSummary interface ---
export interface DailyEarningsSummary {
  lunch: {
    foodTotal: number;
    drinkTotal: number;
    foodEarnings: number; // Earnings from lunch food (base + overage half)
    drinkEarnings: number; // Earnings from lunch drinks (25% share)
    totalEarnings: number; // Total lunch earnings
    foodBreakdown: {
      base: number;
      overage: number;
      overageHalf: number;
    };
    drinkBreakdown: {
        total: number;
        share: number;
    };
  };
  dinner: {
    foodTotal: number; // Total food sales for dinner shift
    drinkTotal: number; // Total drink sales for dinner shift
    foodEarnings: number; // Our total earnings from dinner food (our sales share + shift share)
    drinkEarnings: number; // Earnings from dinner drinks (25% share)
    totalEarnings: number; // Total dinner earnings
     // New breakdown for dinner food earnings
     foodBreakdown: {
        totalDinnerFood: number;
        ourDinnerFoodSales: number; // Dinner food sales specifically marked as 'ours'
        ourFoodSalesShare: number; // 75% of ourDinnerFoodSales
        totalFoodShiftSharePool: number; // 25% of totalDinnerFood
        ourShiftShare: number; // Our share of the 25% pool
        numberOfPeopleWorking: number; // Number of people used for shift share calculation
     };
    drinkBreakdown: {
        total: number;
        share: number;
      };
  };
  dayTotalEarnings: number; // Total earnings for this specific day
}

// --- Updated structure of the range summary ---
// Export the RangeSummary interface as well if it's used elsewhere
export interface RangeSummary {
    totalFood: number; // Overall total food for the range
    totalDrinks: number; // Overall total drinks for the range
    // --- Breakdown by meal type for the range ---
    totalLunchFood: number;
    totalLunchDrinks: number;
    totalDinnerFood: number;
    totalDinnerDrinks: number;
    // --- Corrected overall total earnings for the range (Sum of Daily Totals) ---
    totalPhulkasEarnings: number;
}

// Import date-fns for date handling
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';


// --- Function to calculate daily earnings summary for a list of bills for a single day ---
// Updated to use mealType, isOurFood, and numberOfPeopleWorkingDinner
// FIX: Corrected Lunch Earnings calculation
export const calculateDailyEarnings = (billsForDay: Bill[]): DailyEarningsSummary => {
  let lunchFoodTotal = 0;
  let lunchDrinkTotal = 0;
  let dinnerFoodTotal = 0; // Total food sales for dinner shift
  let dinnerDrinkTotal = 0; // Total drink sales for dinner shift
  let ourDinnerFoodSales = 0; // Dinner food sales specifically marked as 'ours'
  let numberOfPeopleWorkingDinner = 1; // Default number of people working dinner to 1

  // Group bills by meal type and collect number of people for dinner
  const lunchBills = billsForDay.filter(bill => bill.mealType === 'lunch'); // Use string representation on client
  const dinnerBills = billsForDay.filter(bill => bill.mealType === 'dinner'); // Use string representation on client


  // Calculate totals for Lunch
  lunchBills.forEach(bill => {
      lunchFoodTotal += bill.foodAmount;
      lunchDrinkTotal += bill.drinkAmount;
  });

  // Calculate totals and our sales for Dinner
  dinnerBills.forEach(bill => {
      dinnerFoodTotal += bill.foodAmount;
      dinnerDrinkTotal += bill.drinkAmount;
      if (bill.isOurFood) { // isOurFood is boolean from the API/db
          ourDinnerFoodSales += bill.foodAmount;
      }
       // Take the number of people from the first dinner bill found, assuming consistency
       if (bill.numberOfPeopleWorkingDinner !== undefined && bill.numberOfPeopleWorkingDinner !== null && bill.numberOfPeopleWorkingDinner > 0) {
           numberOfPeopleWorkingDinner = bill.numberOfPeopleWorkingDinner;
       }
  });


  // --- Earnings Calculation Logic (Matches DailySummaryCard logic) ---

  // Lunch Calculation
  const lunchBase = 8000; // Assuming a base amount
  const lunchFoodOverage = Math.max(0, lunchFoodTotal - lunchBase);
  // FIX: Lunch food earnings are 0 if no lunch sales, otherwise base + half overage
  const lunchFoodEarnings = lunchFoodTotal > 0 ? lunchBase + lunchFoodOverage / 2 : 0;
  const lunchDrinkShare = lunchDrinkTotal * 0.25;
  const lunchTotalEarnings = lunchFoodEarnings + lunchDrinkShare;


  // Dinner Calculation (Updated Food Logic)
  const dinnerDrinkShare = dinnerDrinkTotal * 0.25; // Drinks share remains the same

  // New Dinner Food Calculation
  const ourFoodSalesShare = ourDinnerFoodSales * 0.75; // 75% of our dinner food sales
  const totalDinnerFoodShiftSharePool = dinnerFoodTotal * 0.25; // 25% of total dinner food sales
  // Calculate our share of the shift pool - handle division by zero
  const ourShiftShare = numberOfPeopleWorkingDinner > 0 ? totalDinnerFoodShiftSharePool / numberOfPeopleWorkingDinner : 0;

  // Total earnings from dinner food
  const totalDinnerFoodEarnings = ourFoodSalesShare + ourShiftShare;

  // Total Dinner Earnings
  const dinnerTotalEarnings = totalDinnerFoodEarnings + dinnerDrinkShare;

  // Total Day Earnings
  const dayTotalEarnings = lunchTotalEarnings + dinnerTotalEarnings;
  // --- End Earnings Calculation Logic ---


  return {
    lunch: {
      foodTotal: lunchFoodTotal,
      drinkTotal: lunchDrinkTotal,
      foodEarnings: lunchFoodEarnings,
      drinkEarnings: lunchDrinkShare,
      totalEarnings: lunchTotalEarnings,
      foodBreakdown: { base: lunchBase, overage: lunchFoodOverage, overageHalf: lunchFoodOverage / 2 },
      drinkBreakdown: { total: lunchDrinkTotal, share: lunchDrinkShare },
    },
    dinner: {
      foodTotal: dinnerFoodTotal,
      drinkTotal: dinnerDrinkTotal,
      foodEarnings: totalDinnerFoodEarnings, // This is now our calculated total dinner food earnings
      drinkEarnings: dinnerDrinkShare,
      totalEarnings: dinnerTotalEarnings,
       // Updated dinner food breakdown
       foodBreakdown: {
           totalDinnerFood: dinnerFoodTotal,
           ourDinnerFoodSales: ourDinnerFoodSales,
           ourFoodSalesShare: ourFoodSalesShare,
           totalFoodShiftSharePool: totalDinnerFoodShiftSharePool,
           ourShiftShare: ourShiftShare,
           numberOfPeopleWorking: numberOfPeopleWorkingDinner, // Include the number used
        },
      drinkBreakdown: {
        total: dinnerDrinkTotal,
        share: dinnerDrinkShare,
      },
    },
    dayTotalEarnings: dayTotalEarnings,
  };
};


// --- Function to calculate range summary for a list of bills across a range ---
// This function sums the 'dayTotalEarnings' of each day's summary.
// Ensure this function uses the updated calculateDailyEarnings
// FIX: Ensure this function correctly calculates and returns range totals
export const calculateRangeSummary = (billsInRange: Bill[]): RangeSummary => {
    let totalFoodAmountForRange = 0;
    let totalDrinkAmountForRange = 0;
    let totalLunchFoodForRange = 0;
    let totalLunchDrinksForRange = 0;
    let totalDinnerFoodForRange = 0;
    let totalDinnerDrinksForRange = 0;
    let totalPhulkasEarningsForRange = 0; // Initialize total earnings for the range


    // Group bills by date first to calculate daily summaries
    const billsByDate: { [key: string]: Bill[] } = {};
    billsInRange.forEach(bill => {
        // Use format to get a consistent date string key (e.g., 'yyyy-MM-dd')
        const dateKey = format(bill.date instanceof Date ? bill.date : new Date(bill.date), 'yyyy-MM-dd');
        if (!billsByDate[dateKey]) {
            billsByDate[dateKey] = [];
        }
        billsByDate[dateKey].push(bill);

         // Also sum up overall food and drink totals for the range summary
        totalFoodAmountForRange += bill.foodAmount;
        totalDrinkAmountForRange += bill.drinkAmount;

        // Use string value 'lunch'/'dinner' as processed on client side
        if (bill.mealType === 'lunch') {
            totalLunchFoodForRange += bill.foodAmount;
            totalLunchDrinksForRange += bill.drinkAmount;
        } else if (bill.mealType === 'dinner') { // Assume 'dinner' if not 'lunch'
            totalDinnerFoodForRange += bill.foodAmount;
            totalDinnerDrinksForRange += bill.drinkAmount;
        }
    });

    // Calculate daily summaries for each day that has bills and sum their total earnings
    Object.keys(billsByDate).forEach(dateKey => {
        const billsForDay = billsByDate[dateKey];
        // Call calculateDailyEarnings for each day
        // The numberOfPeopleWorkingDinner will be taken from the bill object within calculateDailyEarnings
        const dailySummary = calculateDailyEarnings(billsForDay);
        totalPhulkasEarningsForRange += dailySummary.dayTotalEarnings; // Sum the daily total earnings
    });


    return {
        totalFood: totalFoodAmountForRange,
        totalDrinks: totalDrinkAmountForRange,
        totalLunchFood: totalLunchFoodForRange,
        totalLunchDrinks: totalLunchDrinksForRange,
        totalDinnerFood: totalDinnerFoodForRange,
        totalDinnerDrinks: totalDinnerDrinksForRange,
        totalPhulkasEarnings: totalPhulkasEarningsForRange,
    };
};

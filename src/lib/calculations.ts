// src/lib/calculations.ts
import { Bill } from '@/types/Bill';
import { format, isSameDay } from 'date-fns';

// Define the updated structure of the Daily/Range Summary
export interface MealSummary {
  rawFoodTotal: number;
  rawDrinkTotal: number;
  
  // For Lunch: foodEarnings is direct share, drinkEarnings is direct share
  // For Dinner: foodEarnings represents our direct 75% share if applicable (0 otherwise)
  //             drinkEarnings will store our share from the common pool (food+drinks combined)
  phulkasEarnings: number; // The final total from all sources (direct + common pool)
  
  // Additional fields needed for displaying the breakdown in DailySummaryCard
  isOurFood?: boolean; // Optional, only relevant for Dinner
  numberOfPeopleWorkingDinner?: number; // Optional, only relevant for Dinner
}

// Helper to get a default empty meal summary
const getDefaultMealSummary = (): MealSummary => ({
  rawFoodTotal: 0,
  rawDrinkTotal: 0,
  foodEarnings: 0,
  drinkEarnings: 0,
  phulkasEarnings: 0,
});

// Helper to get a default empty daily summary
export interface DailySummary {
  lunch: MealSummary;
  dinner: MealSummary;
  dayTotalEarnings: number;
}

const getDefaultDailySummary = (): DailySummary => ({
  lunch: getDefaultMealSummary(),
  dinner: getDefaultMealSummary(),
  dayTotalEarnings: 0,
});

const LUNCH_FOOD_BASE_INCOME = 8000;

// Calculation for Lunch Meal Summary
const calculateLunchMealSummary = (foodAmount: number, drinkAmount: number): MealSummary => {
  const foodOverage = Math.max(0, foodAmount - LUNCH_FOOD_BASE_INCOME);
  const foodEarnings = LUNCH_FOOD_BASE_INCOME + (foodOverage * 0.5);

  const drinkEarnings = drinkAmount * 0.5; // Drinks always 50% for Phulkas for lunch
  const phulkasEarnings = foodEarnings + drinkEarnings;

  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: foodEarnings,
    drinkEarnings: drinkEarnings,
    phulkasEarnings: phulkasEarnings,
  };
};

// Calculation for Dinner Meal Summary (UPDATED LOGIC based on user's detailed example)
const calculateDinnerMealSummary = (foodAmount: number, drinkAmount: number, isOurFood: boolean, numberOfPeopleWorkingDinner: number): MealSummary => {
  const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner); // Ensure no division by zero

  let directFoodEarnings = 0; // Our direct 75% share if 'Is Our Food?' is Yes
  let commonPoolFoodContribution = 0; // Food amount contributing to common pool
  let commonPoolDrinkContribution = drinkAmount * 0.25; // Drinks always contribute 25% to common pool for dinner

  if (isOurFood) {
    directFoodEarnings = foodAmount * 0.75;
    commonPoolFoodContribution = foodAmount * 0.25;
  } else {
    // If not our food, the entire food bill goes to the common pool
    commonPoolFoodContribution = foodAmount;
  }

  const totalCommonPool = commonPoolFoodContribution + commonPoolDrinkContribution;
  const ourShareFromCommonPool = totalCommonPool / effectiveWorkers;

  const phulkasEarnings = directFoodEarnings + ourShareFromCommonPool;

  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: directFoodEarnings, // This now represents our direct 75% for "our food", 0 otherwise.
    drinkEarnings: ourShareFromCommonPool, // This now represents our share from the common pool (food+drinks combined)
    phulkasEarnings: phulkasEarnings,
    isOurFood: isOurFood, // Pass these through for display in DailySummaryCard
    numberOfPeopleWorkingDinner: numberOfPeopleWorkingDinner, // Pass these through for display
  };
};


// Function to calculate daily earnings for a list of bills (aggregating detailed MealSummary)
export const calculateDailyEarnings = (bills: Bill[]): DailySummary => {
  const dailySummary: DailySummary = getDefaultDailySummary();

  // Temporary storage for dinner aggregation
  let tempDinnerFoodTotal = 0;
  let tempDinnerDrinkTotal = 0;
  let tempDinnerIsOurFood: boolean = true; // Default or take from first bill
  let tempDinnerNumWorkers: number = 1; // Default or take from first bill

  bills.forEach(bill => {
    if (bill.mealType === 'lunch') {
      const mealSummary = calculateLunchMealSummary(bill.foodAmount, bill.drinkAmount);
      dailySummary.lunch.rawFoodTotal += mealSummary.rawFoodTotal;
      dailySummary.lunch.rawDrinkTotal += mealSummary.rawDrinkTotal;
      dailySummary.lunch.foodEarnings += mealSummary.foodEarnings;
      dailySummary.lunch.drinkEarnings += mealSummary.drinkEarnings;
      dailySummary.lunch.phulkasEarnings += mealSummary.phulkasEarnings;
    } else if (bill.mealType === 'dinner') {
      // Aggregate raw totals for dinner first
      tempDinnerFoodTotal += bill.foodAmount;
      tempDinnerDrinkTotal += bill.drinkAmount;
      // For `isOurFood` and `numberOfPeopleWorkingDinner`,
      // we'll use the values from the last processed dinner bill.
      // If consistency is required across multiple dinner bills on a day,
      // a more complex aggregation rule might be needed (e.g., majority, average, or specific flagging).
      tempDinnerIsOurFood = bill.isOurFood ?? true;
      tempDinnerNumWorkers = bill.numberOfPeopleWorkingDinner ?? 1;
    }
  });

  // After iterating through all bills, calculate the aggregated dinner summary once
  if (tempDinnerFoodTotal > 0 || tempDinnerDrinkTotal > 0) {
    const aggregatedDinnerSummary = calculateDinnerMealSummary(
      tempDinnerFoodTotal,
      tempDinnerDrinkTotal,
      tempDinnerIsOurFood,
      tempDinnerNumWorkers
    );
    dailySummary.dinner.rawFoodTotal = aggregatedDinnerSummary.rawFoodTotal;
    dailySummary.dinner.rawDrinkTotal = aggregatedDinnerSummary.rawDrinkTotal;
    dailySummary.dinner.foodEarnings = aggregatedDinnerSummary.foodEarnings;
    dailySummary.dinner.drinkEarnings = aggregatedDinnerSummary.drinkEarnings;
    dailySummary.dinner.phulkasEarnings = aggregatedDinnerSummary.phulkasEarnings;
    dailySummary.dinner.isOurFood = aggregatedDinnerSummary.isOurFood;
    dailySummary.dinner.numberOfPeopleWorkingDinner = aggregatedDinnerSummary.numberOfPeopleWorkingDinner;
  }

  dailySummary.dayTotalEarnings = dailySummary.lunch.phulkasEarnings + dailySummary.dinner.phulkasEarnings;
  return dailySummary;
};

// Function to calculate summary for a range of bills (this now uses calculateDailyEarnings which aggregates daily)
export const calculateRangeSummary = (bills: Bill[]): DailySummary => {
  // If you need a single summary for a range (not day-by-day), this function would need to aggregate
  // all bills in the range into a single set of raw totals, then apply calculations.
  // For now, it delegates to calculateDailyEarnings, which effectively treats the *entire range*
  // as a single "day" for calculation purposes if not further broken down.
  // To get a true range summary, you would sum up the .phulkasEarnings from each day calculated by calculateDailySummariesForRange.
  // Let's adjust this to make it a true range summary
  
  let rangeFoodTotal = 0;
  let rangeDrinkTotal = 0;
  let rangePhulkasEarnings = 0;

  const dailySummaries = calculateDailySummariesForRange(bills);

  dailySummaries.forEach(dailyEntry => {
    rangeFoodTotal += dailyEntry.summary.lunch.rawFoodTotal + dailyEntry.summary.dinner.rawFoodTotal;
    rangeDrinkTotal += dailyEntry.summary.lunch.rawDrinkTotal + dailyEntry.summary.dinner.rawDrinkTotal;
    rangePhulkasEarnings += dailyEntry.summary.dayTotalEarnings;
  });

  // For range summary, we don't need detailed meal summaries directly, but total earnings
  const summaryForRange: DailySummary = {
    lunch: { // Placeholder or combined totals for range
      rawFoodTotal: rangeFoodTotal,
      rawDrinkTotal: rangeDrinkTotal,
      foodEarnings: 0, // Not applicable for range detailed breakdown in this structure
      drinkEarnings: 0, // Not applicable
      phulkasEarnings: 0 // Not applicable
    },
    dinner: { // Placeholder or combined totals for range
      rawFoodTotal: 0,
      rawDrinkTotal: 0,
      foodEarnings: 0, // Not applicable
      drinkEarnings: 0, // Not applicable
      phulkasEarnings: 0 // Not applicable
    },
    dayTotalEarnings: rangePhulkasEarnings // This is the total earnings for the entire range
  };

  return summaryForRange;
};


// Function to calculate daily summaries for a range, used in BillList/Summary Tables
export const calculateDailySummariesForRange = (bills: Bill[]): { date: string; summary: DailySummary }[] => {
  const dailySummariesMap: { [key: string]: {
    lunch: MealSummary,
    dinnerRawFoodTotal: number,
    dinnerRawDrinkTotal: number,
    // Store last seen values for isOurFood and numWorkers for daily dinner aggregation
    lastDinnerIsOurFood: boolean,
    lastDinnerNumWorkers: number
  } } = {};

  bills.forEach(bill => {
    const billDate = format(bill.date, 'yyyy-MM-dd');
    if (!dailySummariesMap[billDate]) {
      dailySummariesMap[billDate] = {
        lunch: getDefaultMealSummary(),
        dinnerRawFoodTotal: 0,
        dinnerRawDrinkTotal: 0,
        lastDinnerIsOurFood: true, // Default
        lastDinnerNumWorkers: 1 // Default
      };
    }

    const currentDayData = dailySummariesMap[billDate];

    if (bill.mealType === 'lunch') {
      const mealSummary = calculateLunchMealSummary(bill.foodAmount, bill.drinkAmount);
      currentDayData.lunch.rawFoodTotal += mealSummary.rawFoodTotal;
      currentDayData.lunch.rawDrinkTotal += mealSummary.rawDrinkTotal;
      currentDayData.lunch.foodEarnings += mealSummary.foodEarnings;
      currentDayData.lunch.drinkEarnings += mealSummary.drinkEarnings;
      currentDayData.lunch.phulkasEarnings += mealSummary.phulkasEarnings;
    } else if (bill.mealType === 'dinner') {
      currentDayData.dinnerRawFoodTotal += bill.foodAmount;
      currentDayData.dinnerRawDrinkTotal += bill.drinkAmount;
      // Update with the last bill's values for these parameters
      currentDayData.lastDinnerIsOurFood = bill.isOurFood ?? true;
      currentDayData.lastDinnerNumWorkers = bill.numberOfPeopleWorkingDinner ?? 1;
    }
  });

  // Convert map to sorted array and finalize dinner calculations
  return Object.keys(dailySummariesMap)
    .sort((a, b) => b.localeCompare(a)) // Sort by date descending
    .map(date => {
      const dayData = dailySummariesMap[date];
      const finalizedDinnerSummary = calculateDinnerMealSummary(
        dayData.dinnerRawFoodTotal,
        dayData.dinnerRawDrinkTotal,
        dayData.lastDinnerIsOurFood,
        dayData.lastDinnerNumWorkers
      );

      const dailySummary: DailySummary = {
        lunch: dayData.lunch,
        dinner: finalizedDinnerSummary,
        dayTotalEarnings: dayData.lunch.phulkasEarnings + finalizedDinnerSummary.phulkasEarnings
      };
      return { date, summary: dailySummary };
    });
};
import { Bill } from '@/types/bill';
// Removed import AppConfig from '@/config/app';
// Define AppConfig type locally for calculations.ts to be self-contained
export interface AppConfig {
  LUNCH_FOOD_BASE_INCOME: number;
  LUNCH_FOOD_OVERAGE_SHARE_PERCENT: number;
  LUNCH_DRINK_SHARE_PERCENT: number;
  DINNER_FOOD_OUR_SHARE_PERCENT: number;
  DINNER_FOOD_COMMON_POOL_PERCENT: number;
  DINNER_DRINK_COMMON_POOL_PERCENT: number;
}

import { format, isValid, parseISO } from 'date-fns';

export interface MealSummary {
  rawFoodTotal: number;
  rawDrinkTotal: number;
  foodEarnings: number;
  drinkEarnings: number;
  phulkasEarnings: number;
  isOurFood: boolean;
  numberOfPeopleWorkingDinner: number;
}

export interface DailySummary {
  lunch: MealSummary;
  dinner: MealSummary;
  dayTotalEarnings: number;
}

const getDefaultMealSummary = (): MealSummary => ({
  rawFoodTotal: 0,
  rawDrinkTotal: 0,
  foodEarnings: 0,
  drinkEarnings: 0,
  phulkasEarnings: 0,
  isOurFood: true,
  numberOfPeopleWorkingDinner: 1,
});

const getDefaultDailySummary = (): DailySummary => ({
  lunch: getDefaultMealSummary(),
  dinner: getDefaultMealSummary(),
  dayTotalEarnings: 0,
});

// CRITICAL: Functions now accept AppConfig as an argument
export const calculateLunchMealSummary = (foodAmount: number, drinkAmount: number, config: AppConfig): MealSummary => {
  const foodOverage = Math.max(0, foodAmount - config.LUNCH_FOOD_BASE_INCOME);
  const foodEarnings = config.LUNCH_FOOD_BASE_INCOME + (foodOverage * config.LUNCH_FOOD_OVERAGE_SHARE_PERCENT);
  const drinkEarnings = drinkAmount * config.LUNCH_DRINK_SHARE_PERCENT;
  const phulkasEarnings = foodEarnings + drinkEarnings;
  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: foodEarnings,
    drinkEarnings: drinkEarnings,
    phulkasEarnings: phulkasEarnings,
    isOurFood: true,
    numberOfPeopleWorkingDinner: 1,
  };
};

// CRITICAL: Functions now accept AppConfig as an argument
export const calculateDinnerMealSummary = (foodAmount: number, drinkAmount: number, isOurFood: boolean, numberOfPeopleWorkingDinner: number, config: AppConfig): MealSummary => {
  const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner);
  
  let foodEarnings = 0;
  let drinkEarnings = 0;

  if (isOurFood) {
    foodEarnings = foodAmount * config.DINNER_FOOD_OUR_SHARE_PERCENT;
    drinkEarnings = (drinkAmount * config.DINNER_DRINK_COMMON_POOL_PERCENT) / effectiveWorkers;
  } else {
    foodEarnings = (foodAmount * config.DINNER_FOOD_COMMON_POOL_PERCENT) / effectiveWorkers;
    drinkEarnings = (drinkAmount * config.DINNER_DRINK_COMMON_POOL_PERCENT) / effectiveWorkers;
  }

  const phulkasEarnings = foodEarnings + drinkEarnings;

  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: foodEarnings,
    drinkEarnings: drinkEarnings,
    phulkasEarnings: phulkasEarnings,
    isOurFood: isOurFood,
    numberOfPeopleWorkingDinner: numberOfPeopleWorkingDinner,
  };
};

// CRITICAL: Functions now accept AppConfig as an argument
export const calculateDailyEarnings = (bills: Bill[], config: AppConfig): DailySummary => {
  const dailySummary: DailySummary = getDefaultDailySummary();

  let totalLunchFoodAmount = 0;
  let totalLunchDrinkAmount = 0;

  let tempDinnerFoodTotal = 0;
  let tempDinnerDrinkTotal = 0;
  let tempDinnerIsOurFood: boolean = true;
  let tempDinnerNumWorkers: number = 1;

  bills.forEach(bill => {
    if (bill.mealType === 'lunch') {
      totalLunchFoodAmount += bill.foodAmount;
      totalLunchDrinkAmount += bill.drinkAmount;
    } else if (bill.mealType === 'dinner') {
      tempDinnerFoodTotal += bill.foodAmount;
      tempDinnerDrinkTotal += bill.drinkAmount;
      tempDinnerIsOurFood = bill.isOurFood ?? true;
      tempDinnerNumWorkers = bill.numberOfPeopleWorkingDinner ?? 1;
    }
  });

  if (totalLunchFoodAmount > 0 || totalLunchDrinkAmount > 0) {
    const aggregatedLunchSummary = calculateLunchMealSummary(totalLunchFoodAmount, totalLunchDrinkAmount, config); // Pass config
    dailySummary.lunch = aggregatedLunchSummary;
  }

  if (tempDinnerFoodTotal > 0 || tempDinnerDrinkTotal > 0) {
    const aggregatedDinnerSummary = calculateDinnerMealSummary(
      tempDinnerFoodTotal,
      tempDinnerDrinkTotal,
      tempDinnerIsOurFood,
      tempDinnerNumWorkers,
      config // Pass config
    );
    dailySummary.dinner = aggregatedDinnerSummary;
  }

  dailySummary.dayTotalEarnings = dailySummary.lunch.phulkasEarnings + dailySummary.dinner.phulkasEarnings;
  return dailySummary;
};

// CRITICAL: Functions now accept AppConfig as an argument
export const calculateRangeSummary = (bills: Bill[], config: AppConfig): DailySummary => {
  let totalRawFood = 0;
  let totalRawDrink = 0;
  let totalLunchPhulkasEarnings = 0;
  let totalDinnerPhulkasEarnings = 0;
  let totalOverallPhulkasEarnings = 0;

  // calculateDailySummariesForRange will also need config
  const dailySummaries = calculateDailySummariesForRange(bills, config); // Pass config

  dailySummaries.forEach(dailyEntry => {
    totalRawFood += dailyEntry.summary.lunch.rawFoodTotal + dailyEntry.summary.dinner.rawFoodTotal;
    totalRawDrink += dailyEntry.summary.lunch.rawDrinkTotal + dailyEntry.summary.dinner.rawDrinkTotal;
    
    totalLunchPhulkasEarnings += dailyEntry.summary.lunch.phulkasEarnings;
    totalDinnerPhulkasEarnings += dailyEntry.summary.dinner.phulkasEarnings;
    
    totalOverallPhulkasEarnings += dailyEntry.summary.dayTotalEarnings;
  });

  const summaryForRange: DailySummary = {
    lunch: {
      rawFoodTotal: totalRawFood,
      rawDrinkTotal: totalRawDrink,
      foodEarnings: 0,
      drinkEarnings: 0,
      phulkasEarnings: totalLunchPhulkasEarnings,
      isOurFood: true,
      numberOfPeopleWorkingDinner: 1,
    },
    dinner: {
      rawFoodTotal: 0,
      rawDrinkTotal: 0,
      foodEarnings: 0,
      drinkEarnings: 0,
      phulkasEarnings: totalDinnerPhulkasEarnings,
      isOurFood: true,
      numberOfPeopleWorkingDinner: 1,
    },
    dayTotalEarnings: totalOverallPhulkasEarnings
  };

  return summaryForRange;
};

// CRITICAL: Functions now accept AppConfig as an argument
export const calculateDailySummariesForRange = (bills: Bill[], config: AppConfig): { date: string; summary: DailySummary }[] => {
  const dailyBillsMap: { [key: string]: Bill[] } = {};

  bills.forEach(bill => {
    const parsedDate = parseISO(bill.date);
    if (isValid(parsedDate)) {
      const billDate = format(parsedDate, 'yyyy-MM-dd');
      if (!dailyBillsMap[billDate]) {
        dailyBillsMap[billDate] = [];
      }
      dailyBillsMap[billDate].push(bill);
    } else {
      console.warn(`Skipping bill with invalid date: ${bill.date}`);
    }
  });

  return Object.keys(dailyBillsMap)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const billsForThisDay = dailyBillsMap[date];
      const dailySummary = calculateDailyEarnings(billsForThisDay, config); // Pass config
      return { date, summary: dailySummary };
    });
};

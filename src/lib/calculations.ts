import { Bill } from '@/types/bill';
import { AppConfig } from '@/config/app';
import { format, isValid, parseISO } from 'date-fns';

export interface MealSummary {
  rawFoodTotal: number;
  rawDrinkTotal: number;
  foodEarnings: number;
  drinkEarnings: number;
  phulkasEarnings: number;
  isOurFood?: boolean;
  numberOfPeopleWorkingDinner?: number;
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
});

const getDefaultDailySummary = (): DailySummary => ({
  lunch: getDefaultMealSummary(),
  dinner: getDefaultMealSummary(),
  dayTotalEarnings: 0,
});

export const calculateLunchMealSummary = (foodAmount: number, drinkAmount: number): MealSummary => {
  const foodOverage = Math.max(0, foodAmount - AppConfig.LUNCH_FOOD_BASE_INCOME);
  const foodEarnings = AppConfig.LUNCH_FOOD_BASE_INCOME + (foodOverage * AppConfig.LUNCH_FOOD_OVERAGE_SHARE_PERCENT);
  const drinkEarnings = drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT;
  const phulkasEarnings = foodEarnings + drinkEarnings;
  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: foodEarnings,
    drinkEarnings: drinkEarnings,
    phulkasEarnings: phulkasEarnings,
  };
};

export const calculateDinnerMealSummary = (foodAmount: number, drinkAmount: number, isOurFood: boolean, numberOfPeopleWorkingDinner: number): MealSummary => {
  const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner);
  
  let foodEarnings = 0;
  let drinkEarnings = 0;

  if (isOurFood) {
    // If it's 'our food', we get a direct share of the food amount
    foodEarnings = foodAmount * AppConfig.DINNER_FOOD_OUR_SHARE_PERCENT;
    // The drink amount still goes to a common pool and is shared
    drinkEarnings = (drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT) / effectiveWorkers;
  } else {
    // If it's NOT 'our food', both food and drink contribute to the common pool
    // and our earnings come from our share of that total common pool.
    // The `foodEarnings` and `drinkEarnings` here represent our share from their respective common pools.
    foodEarnings = (foodAmount * AppConfig.DINNER_FOOD_COMMON_POOL_PERCENT) / effectiveWorkers;
    drinkEarnings = (drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT) / effectiveWorkers;
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

export const calculateDailyEarnings = (bills: Bill[]): DailySummary => {
  const dailySummary: DailySummary = getDefaultDailySummary();

  let totalLunchFoodAmount = 0;
  let totalLunchDrinkAmount = 0;

  let tempDinnerFoodTotal = 0;
  let tempDinnerDrinkTotal = 0;
  let tempDinnerIsOurFood: boolean = true; // Default or last encountered
  let tempDinnerNumWorkers: number = 1; // Default or last encountered

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
    const aggregatedLunchSummary = calculateLunchMealSummary(totalLunchFoodAmount, totalLunchDrinkAmount);
    dailySummary.lunch = aggregatedLunchSummary;
  }

  if (tempDinnerFoodTotal > 0 || tempDinnerDrinkTotal > 0) {
    const aggregatedDinnerSummary = calculateDinnerMealSummary(
      tempDinnerFoodTotal,
      tempDinnerDrinkTotal,
      tempDinnerIsOurFood,
      tempDinnerNumWorkers
    );
    dailySummary.dinner = aggregatedDinnerSummary;
  }

  dailySummary.dayTotalEarnings = dailySummary.lunch.phulkasEarnings + dailySummary.dinner.phulkasEarnings;
  return dailySummary;
};

export const calculateRangeSummary = (bills: Bill[]): DailySummary => {
  let totalRawFood = 0;
  let totalRawDrink = 0;
  let totalLunchPhulkasEarnings = 0;
  let totalDinnerPhulkasEarnings = 0;
  let totalOverallPhulkasEarnings = 0;

  const dailySummaries = calculateDailySummariesForRange(bills);

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
      phulkasEarnings: totalLunchPhulkasEarnings
    },
    dinner: {
      rawFoodTotal: 0,
      rawDrinkTotal: 0,
      foodEarnings: 0,
      drinkEarnings: 0,
      phulkasEarnings: totalDinnerPhulkasEarnings
    },
    dayTotalEarnings: totalOverallPhulkasEarnings
  };

  return summaryForRange;
};

export const calculateDailySummariesForRange = (bills: Bill[]): { date: string; summary: DailySummary }[] => {
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
      const dailySummary = calculateDailyEarnings(billsForThisDay);
      return { date, summary: dailySummary };
    });
};

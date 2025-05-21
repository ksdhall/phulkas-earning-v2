import { Bill } from '@/types/bill';
import { AppConfig } from '@/config/app';
import { format } from 'date-fns';

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

const calculateLunchMealSummary = (foodAmount: number, drinkAmount: number): MealSummary => {
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

const calculateDinnerMealSummary = (foodAmount: number, drinkAmount: number, isOurFood: boolean, numberOfPeopleWorkingDinner: number): MealSummary => {
  const effectiveWorkers = Math.max(1, numberOfPeopleWorkingDinner);
  let directFoodEarnings = 0;
  const commonPoolFoodContribution = foodAmount * AppConfig.DINNER_FOOD_COMMON_POOL_PERCENT;
  const commonPoolDrinkContribution = drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT;

  if (isOurFood) {
    directFoodEarnings = foodAmount * AppConfig.DINNER_FOOD_OUR_SHARE_PERCENT;
  } else {
    directFoodEarnings = 0;
  }

  const totalCommonPool = commonPoolFoodContribution + commonPoolDrinkContribution;
  const ourShareFromCommonPool = totalCommonPool / effectiveWorkers;
  const phulkasEarnings = directFoodEarnings + ourShareFromCommonPool;

  return {
    rawFoodTotal: foodAmount,
    rawDrinkTotal: drinkAmount,
    foodEarnings: directFoodEarnings,
    drinkEarnings: ourShareFromCommonPool,
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

  // Calculate Lunch Summary once with aggregated totals
  if (totalLunchFoodAmount > 0 || totalLunchDrinkAmount > 0) {
    const aggregatedLunchSummary = calculateLunchMealSummary(totalLunchFoodAmount, totalLunchDrinkAmount);
    dailySummary.lunch = aggregatedLunchSummary; // Assign the calculated summary directly
  }

  // Calculate Dinner Summary once with aggregated totals
  if (tempDinnerFoodTotal > 0 || tempDinnerDrinkTotal > 0) {
    const aggregatedDinnerSummary = calculateDinnerMealSummary(
      tempDinnerFoodTotal,
      tempDinnerDrinkTotal,
      tempDinnerIsOurFood,
      tempDinnerNumWorkers
    );
    dailySummary.dinner = aggregatedDinnerSummary; // Assign the calculated summary directly
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
    const billDate = format(new Date(bill.date), 'yyyy-MM-dd');
    if (!dailyBillsMap[billDate]) {
      dailyBillsMap[billDate] = [];
    }
    dailyBillsMap[billDate].push(bill);
  });

  return Object.keys(dailyBillsMap)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const billsForThisDay = dailyBillsMap[date];
      const dailySummary = calculateDailyEarnings(billsForThisDay);
      return { date, summary: dailySummary };
    });
};

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
  let tempDinnerFoodTotal = 0;
  let tempDinnerDrinkTotal = 0;
  let tempDinnerIsOurFood: boolean = true;
  let tempDinnerNumWorkers: number = 1;

  bills.forEach(bill => {
    if (bill.mealType === 'lunch') {
      const mealSummary = calculateLunchMealSummary(bill.foodAmount, bill.drinkAmount);
      dailySummary.lunch.rawFoodTotal += mealSummary.rawFoodTotal;
      dailySummary.lunch.rawDrinkTotal += mealSummary.rawDrinkTotal;
      dailySummary.lunch.foodEarnings += mealSummary.foodEarnings;
      dailySummary.lunch.drinkEarnings += mealSummary.drinkEarnings;
      dailySummary.lunch.phulkasEarnings += mealSummary.phulkasEarnings;
    } else if (bill.mealType === 'dinner') {
      tempDinnerFoodTotal += bill.foodAmount;
      tempDinnerDrinkTotal += bill.drinkAmount;
      tempDinnerIsOurFood = bill.isOurFood ?? true;
      tempDinnerNumWorkers = bill.numberOfPeopleWorkingDinner ?? 1;
    }
  });

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

export const calculateRangeSummary = (bills: Bill[]): DailySummary => {
  let rangeFoodTotal = 0;
  let rangeDrinkTotal = 0;
  let rangePhulkasEarnings = 0;

  const dailySummaries = calculateDailySummariesForRange(bills);

  dailySummaries.forEach(dailyEntry => {
    rangeFoodTotal += dailyEntry.summary.lunch.rawFoodTotal + dailyEntry.summary.dinner.rawFoodTotal;
    rangeDrinkTotal += dailyEntry.summary.lunch.rawDrinkTotal + dailyEntry.summary.dinner.rawDrinkTotal;
    rangePhulkasEarnings += dailyEntry.summary.dayTotalEarnings;
  });

  const summaryForRange: DailySummary = {
    lunch: {
      rawFoodTotal: rangeFoodTotal,
      rawDrinkTotal: rangeDrinkTotal,
      foodEarnings: 0,
      drinkEarnings: 0,
      phulkasEarnings: 0
    },
    dinner: {
      rawFoodTotal: 0,
      rawDrinkTotal: 0,
      foodEarnings: 0,
      drinkEarnings: 0,
      phulkasEarnings: 0
    },
    dayTotalEarnings: rangePhulkasEarnings
  };

  return summaryForRange;
};

export const calculateDailySummariesForRange = (bills: Bill[]): { date: string; summary: DailySummary }[] => {
  const dailySummariesMap: { [key: string]: {
    lunch: MealSummary,
    dinnerRawFoodTotal: number,
    dinnerRawDrinkTotal: number,
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
        lastDinnerIsOurFood: true,
        lastDinnerNumWorkers: 1
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
      currentDayData.lastDinnerIsOurFood = bill.isOurFood ?? true;
      currentDayData.lastDinnerNumWorkers = bill.numberOfPeopleWorkingDinner ?? 1;
    }
  });

  return Object.keys(dailySummariesMap)
    .sort((a, b) => b.localeCompare(a))
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
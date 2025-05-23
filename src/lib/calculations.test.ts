import {
  calculateLunchMealSummary,
  calculateDinnerMealSummary,
  calculateDailyEarnings,
  calculateRangeSummary,
  calculateDailySummariesForRange,
  MealSummary,
  DailySummary,
} from './calculations';
import { Bill } from '@/types/Bill';
import { AppConfig } from '@/config/app';

describe('Calculation Functions', () => {
  // --- calculateLunchMealSummary ---
  describe('calculateLunchMealSummary', () => {
    it('should calculate lunch summary correctly with base income only', () => {
      const foodAmount = AppConfig.LUNCH_FOOD_BASE_INCOME;
      const drinkAmount = 1000;
      const result = calculateLunchMealSummary(foodAmount, drinkAmount);
      expect(result).toEqual<MealSummary>({
        rawFoodTotal: foodAmount,
        rawDrinkTotal: drinkAmount,
        foodEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME,
        drinkEarnings: drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT,
        phulkasEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME + (drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT),
      });
    });

    it('should calculate lunch summary correctly with overage', () => {
      const foodAmount = 10000;
      const drinkAmount = 2000;
      const overage = foodAmount - AppConfig.LUNCH_FOOD_BASE_INCOME;
      const expectedFoodEarnings = AppConfig.LUNCH_FOOD_BASE_INCOME + (overage * AppConfig.LUNCH_FOOD_OVERAGE_SHARE_PERCENT);
      const expectedDrinkEarnings = drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT;

      const result = calculateLunchMealSummary(foodAmount, drinkAmount);
      expect(result).toEqual<MealSummary>({
        rawFoodTotal: foodAmount,
        rawDrinkTotal: drinkAmount,
        foodEarnings: expectedFoodEarnings,
        drinkEarnings: expectedDrinkEarnings,
        phulkasEarnings: expectedFoodEarnings + expectedDrinkEarnings,
      });
    });

    it('should handle foodAmount less than base income (still provides base income)', () => {
      const foodAmount = AppConfig.LUNCH_FOOD_BASE_INCOME - 1000; // e.g., 7000 if base is 8000
      const drinkAmount = 500;
      const result = calculateLunchMealSummary(foodAmount, drinkAmount);
      expect(result).toEqual<MealSummary>({
        rawFoodTotal: foodAmount,
        rawDrinkTotal: drinkAmount,
        foodEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME, // Food earnings should be base income
        drinkEarnings: drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT,
        phulkasEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME + (drinkAmount * AppConfig.LUNCH_DRINK_SHARE_PERCENT),
      });
    });

    it('should handle zero food and drink amounts', () => {
      const result = calculateLunchMealSummary(0, 0);
      expect(result).toEqual<MealSummary>({
        rawFoodTotal: 0,
        rawDrinkTotal: 0,
        foodEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME, // Food earnings should be base income
        drinkEarnings: 0,
        phulkasEarnings: AppConfig.LUNCH_FOOD_BASE_INCOME,
      });
    });
  });

  // --- calculateDinnerMealSummary ---
  describe('calculateDinnerMealSummary', () => {
    it('should calculate dinner summary correctly for our food (direct share)', () => {
      const foodAmount = 5000;
      const drinkAmount = 1000;
      const numberOfPeopleWorkingDinner = 2;
      const isOurFood = true;

      const expectedFoodEarnings = foodAmount * AppConfig.DINNER_FOOD_OUR_SHARE_PERCENT;
      const expectedDrinkEarnings = (drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT) / numberOfPeopleWorkingDinner;
      const expectedPhulkasEarnings = expectedFoodEarnings + expectedDrinkEarnings;

      const result = calculateDinnerMealSummary(foodAmount, drinkAmount, isOurFood, numberOfPeopleWorkingDinner);
      expect(result.rawFoodTotal).toBe(foodAmount);
      expect(result.rawDrinkTotal).toBe(drinkAmount);
      expect(result.foodEarnings).toBeCloseTo(expectedFoodEarnings);
      expect(result.drinkEarnings).toBeCloseTo(expectedDrinkEarnings); // Corrected expectation
      expect(result.phulkasEarnings).toBeCloseTo(expectedPhulkasEarnings);
      expect(result.isOurFood).toBe(isOurFood);
      expect(result.numberOfPeopleWorkingDinner).toBe(numberOfPeopleWorkingDinner);
    });

    it('should calculate dinner summary correctly for not our food (common pool for both)', () => {
      const foodAmount = 5000;
      const drinkAmount = 1000;
      const numberOfPeopleWorkingDinner = 2;
      const isOurFood = false;

      const expectedFoodEarnings = (foodAmount * AppConfig.DINNER_FOOD_COMMON_POOL_PERCENT) / numberOfPeopleWorkingDinner;
      const expectedDrinkEarnings = (drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT) / numberOfPeopleWorkingDinner;
      const expectedPhulkasEarnings = expectedFoodEarnings + expectedDrinkEarnings;

      const result = calculateDinnerMealSummary(foodAmount, drinkAmount, isOurFood, numberOfPeopleWorkingDinner);
      expect(result.rawFoodTotal).toBe(foodAmount);
      expect(result.rawDrinkTotal).toBe(drinkAmount);
      expect(result.foodEarnings).toBeCloseTo(expectedFoodEarnings);
      expect(result.drinkEarnings).toBeCloseTo(expectedDrinkEarnings);
      expect(result.phulkasEarnings).toBeCloseTo(expectedPhulkasEarnings);
      expect(result.isOurFood).toBe(isOurFood);
      expect(result.numberOfPeopleWorkingDinner).toBe(numberOfPeopleWorkingDinner);
    });

    it('should handle zero food and drink amounts', () => {
      const result = calculateDinnerMealSummary(0, 0, true, 1);
      expect(result).toEqual<MealSummary>({
        rawFoodTotal: 0,
        rawDrinkTotal: 0,
        foodEarnings: 0,
        drinkEarnings: 0,
        phulkasEarnings: 0,
        isOurFood: true,
        numberOfPeopleWorkingDinner: 1,
      });
    });

    it('should handle zero people working (effective workers should be 1)', () => {
      const foodAmount = 1000;
      const drinkAmount = 500;
      const isOurFood = false;
      const numberOfPeopleWorkingDinner = 0; // Test case for zero workers

      const expectedFoodEarnings = (foodAmount * AppConfig.DINNER_FOOD_COMMON_POOL_PERCENT) / 1;
      const expectedDrinkEarnings = (drinkAmount * AppConfig.DINNER_DRINK_COMMON_POOL_PERCENT) / 1;
      const expectedPhulkasEarnings = expectedFoodEarnings + expectedDrinkEarnings;

      const result = calculateDinnerMealSummary(foodAmount, drinkAmount, isOurFood, numberOfPeopleWorkingDinner);
      expect(result.rawFoodTotal).toBe(foodAmount);
      expect(result.rawDrinkTotal).toBe(drinkAmount);
      expect(result.foodEarnings).toBeCloseTo(expectedFoodEarnings);
      expect(result.drinkEarnings).toBeCloseTo(expectedDrinkEarnings);
      expect(result.phulkasEarnings).toBeCloseTo(expectedPhulkasEarnings);
      expect(result.isOurFood).toBe(isOurFood);
      expect(result.numberOfPeopleWorkingDinner).toBe(numberOfPeopleWorkingDinner);
    });
  });

  // --- calculateDailyEarnings ---
  describe('calculateDailyEarnings', () => {
    it('should calculate daily earnings correctly for a mix of lunch and dinner bills', () => {
      const bills: Bill[] = [
        {
          id: '1',
          date: '2024-07-20',
          foodAmount: 10000, // Lunch overage
          drinkAmount: 2000, // Lunch drinks
          mealType: 'lunch',
          isOurFood: true,
          numberOfPeopleWorkingDinner: 1,
          comments: '',
        },
        {
          id: '2',
          date: '2024-07-20',
          foodAmount: 5000, // Dinner
          drinkAmount: 1000, // Dinner
          mealType: 'dinner',
          isOurFood: true, // Our food dinner
          numberOfPeopleWorkingDinner: 2,
          comments: '',
        },
      ];

      const expectedLunchSummary = calculateLunchMealSummary(bills[0].foodAmount, bills[0].drinkAmount);
      const expectedDinnerSummary = calculateDinnerMealSummary(
        bills[1].foodAmount,
        bills[1].drinkAmount,
        bills[1].isOurFood,
        bills[1].numberOfPeopleWorkingDinner!
      );

      const result = calculateDailyEarnings(bills);

      expect(result.lunch).toEqual(expectedLunchSummary);
      expect(result.dinner).toEqual(expectedDinnerSummary);
      expect(result.dayTotalEarnings).toBeCloseTo(expectedLunchSummary.phulkasEarnings + expectedDinnerSummary.phulkasEarnings);
    });

    it('should handle multiple lunch bills for the same day', () => {
      const bills: Bill[] = [
        {
          id: '1',
          date: '2024-07-20',
          foodAmount: 5000,
          drinkAmount: 500,
          mealType: 'lunch',
          isOurFood: true,
          numberOfPeopleWorkingDinner: 1,
          comments: '',
        },
        {
          id: '2',
          date: '2024-07-20',
          foodAmount: 4000,
          drinkAmount: 300,
          mealType: 'lunch',
          isOurFood: true,
          numberOfPeopleWorkingDinner: 1,
          comments: '',
        },
      ];
      const totalFood = 5000 + 4000;
      const totalDrinks = 500 + 300;
      const expectedLunchSummary = calculateLunchMealSummary(totalFood, totalDrinks);
      const result = calculateDailyEarnings(bills);
      expect(result.lunch).toEqual(expectedLunchSummary);
      expect(result.dinner.phulkasEarnings).toBe(0); // No dinner bills
      expect(result.dayTotalEarnings).toBeCloseTo(expectedLunchSummary.phulkasEarnings);
    });

    it('should handle multiple dinner bills for the same day (aggregating raw amounts, using last flags)', () => {
      const bills: Bill[] = [
        {
          id: '1',
          date: '2024-07-20',
          foodAmount: 3000,
          drinkAmount: 500,
          mealType: 'dinner',
          isOurFood: false, // First dinner bill: not our food
          numberOfPeopleWorkingDinner: 1,
          comments: '',
        },
        {
          id: '2',
          date: '2024-07-20',
          foodAmount: 4000,
          drinkAmount: 800,
          mealType: 'dinner',
          isOurFood: true, // Second dinner bill: our food (this one's flags should be used)
          numberOfPeopleWorkingDinner: 3,
          comments: '',
        },
      ];
      const totalFood = 3000 + 4000;
      const totalDrinks = 500 + 800;
      const expectedDinnerSummary = calculateDinnerMealSummary(
        totalFood,
        totalDrinks,
        bills[1].isOurFood, // Use flags from the last bill
        bills[1].numberOfPeopleWorkingDinner!
      );
      const result = calculateDailyEarnings(bills);
      expect(result.dinner).toEqual(expectedDinnerSummary);
      expect(result.lunch.phulkasEarnings).toBe(0); // No lunch bills
      expect(result.dayTotalEarnings).toBeCloseTo(expectedDinnerSummary.phulkasEarnings);
    });

    it('should handle no bills', () => {
      const bills: Bill[] = [];
      const result = calculateDailyEarnings(bills);
      expect(result.lunch.phulkasEarnings).toBe(0);
      expect(result.dinner.phulkasEarnings).toBe(0);
      expect(result.dayTotalEarnings).toBe(0);
    });
  });

  // --- calculateDailySummariesForRange ---
  describe('calculateDailySummariesForRange', () => {
    it('should group bills by date and calculate daily summaries for each', () => {
      const bills: Bill[] = [
        { id: '1', date: '2024-07-20', foodAmount: 10000, drinkAmount: 2000, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
        { id: '2', date: '2024-07-20', foodAmount: 5000, drinkAmount: 1000, mealType: 'dinner', isOurFood: true, numberOfPeopleWorkingDinner: 2, comments: '' },
        { id: '3', date: '2024-07-21', foodAmount: 8000, drinkAmount: 1500, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
        { id: '4', date: '2024-07-21', foodAmount: 4000, drinkAmount: 800, mealType: 'dinner', isOurFood: false, numberOfPeopleWorkingDinner: 3, comments: '' },
        { id: '5', date: '2024-07-19', foodAmount: 2000, drinkAmount: 300, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
      ];

      const result = calculateDailySummariesForRange(bills);

      // Expect 3 entries for 3 distinct dates
      expect(result.length).toBe(3);

      // Check sorting (latest date first)
      expect(result[0].date).toBe('2024-07-21');
      expect(result[1].date).toBe('2024-07-20');
      expect(result[2].date).toBe('2024-07-19');

      // Verify calculations for a specific day (e.g., 2024-07-20)
      const day1Summary = result.find(entry => entry.date === '2024-07-20')?.summary;
      expect(day1Summary).toBeDefined();
      if (day1Summary) {
        const billsForDay1 = bills.filter(b => b.date === '2024-07-20');
        const expectedDay1Summary = calculateDailyEarnings(billsForDay1);
        expect(day1Summary).toEqual(expectedDay1Summary);
      }

      // Verify calculations for another day (e.g., 2024-07-21)
      const day2Summary = result.find(entry => entry.date === '2024-07-21')?.summary;
      expect(day2Summary).toBeDefined();
      if (day2Summary) {
        const billsForDay2 = bills.filter(b => b.date === '2024-07-21');
        const expectedDay2Summary = calculateDailyEarnings(billsForDay2);
        expect(day2Summary).toEqual(expectedDay2Summary);
      }

      // Verify calculations for 2024-07-19
      const day3Summary = result.find(entry => entry.date === '2024-07-19')?.summary;
      expect(day3Summary).toBeDefined();
      if (day3Summary) {
        const billsForDay3 = bills.filter(b => b.date === '2024-07-19');
        const expectedDay3Summary = calculateDailyEarnings(billsForDay3);
        expect(day3Summary).toEqual(expectedDay3Summary);
      }
    });

    it('should return an empty array if no bills are provided', () => {
      const bills: Bill[] = [];
      const result = calculateDailySummariesForRange(bills);
      expect(result).toEqual([]);
    });

    it('should handle bills with invalid dates gracefully (skipping them)', () => {
        const bills: Bill[] = [
            { id: '1', date: '2024-07-20', foodAmount: 1000, drinkAmount: 100, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
            { id: 'invalid', date: 'invalid-date', foodAmount: 500, drinkAmount: 50, mealType: 'dinner', isOurFood: false, numberOfPeopleWorkingDinner: 1, comments: '' },
        ];
        const result = calculateDailySummariesForRange(bills);
        expect(result.length).toBe(1);
        expect(result[0].date).toBe('2024-07-20');
    });
  });

  // --- calculateRangeSummary ---
  describe('calculateRangeSummary', () => {
    it('should correctly aggregate summaries for a given range of bills', () => {
      const bills: Bill[] = [
        // Day 1: 2024-07-20
        { id: '1', date: '2024-07-20', foodAmount: 10000, drinkAmount: 2000, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
        { id: '2', date: '2024-07-20', foodAmount: 5000, drinkAmount: 1000, mealType: 'dinner', isOurFood: true, numberOfPeopleWorkingDinner: 2, comments: '' },
        // Day 2: 2024-07-21
        { id: '3', date: '2024-07-21', foodAmount: 8000, drinkAmount: 1500, mealType: 'lunch', isOurFood: true, numberOfPeopleWorkingDinner: 1, comments: '' },
        { id: '4', date: '2024-07-21', foodAmount: 4000, drinkAmount: 800, mealType: 'dinner', isOurFood: false, numberOfPeopleWorkingDinner: 3, comments: '' },
      ];

      const dailySummaries = calculateDailySummariesForRange(bills);
      const expectedTotalLunchPhulkasEarnings = dailySummaries.reduce((sum, entry) => sum + entry.summary.lunch.phulkasEarnings, 0);
      const expectedTotalDinnerPhulkasEarnings = dailySummaries.reduce((sum, entry) => sum + entry.summary.dinner.phulkasEarnings, 0);
      const expectedDayTotalEarnings = dailySummaries.reduce((sum, entry) => sum + entry.summary.dayTotalEarnings, 0);

      const result = calculateRangeSummary(bills);

      const expectedRawFoodTotal = dailySummaries.reduce((sum, entry) => sum + entry.summary.lunch.rawFoodTotal + entry.summary.dinner.rawFoodTotal, 0);
      const expectedRawDrinkTotal = dailySummaries.reduce((sum, entry) => sum + entry.summary.lunch.rawDrinkTotal + entry.summary.dinner.rawDrinkTotal, 0);

      expect(result.lunch.rawFoodTotal).toBe(expectedRawFoodTotal);
      expect(result.lunch.rawDrinkTotal).toBe(expectedRawDrinkTotal);
      expect(result.lunch.phulkasEarnings).toBeCloseTo(expectedTotalLunchPhulkasEarnings);

      expect(result.dinner.rawFoodTotal).toBe(0); // Dinner raw totals are 0 in calculateRangeSummary's MealSummary for dinner
      expect(result.dinner.rawDrinkTotal).toBe(0); // Dinner raw totals are 0 in calculateRangeSummary's MealSummary for dinner
      expect(result.dinner.phulkasEarnings).toBeCloseTo(expectedTotalDinnerPhulkasEarnings);

      expect(result.dayTotalEarnings).toBeCloseTo(expectedDayTotalEarnings);
    });

    it('should return a default summary if no bills are provided', () => {
      const bills: Bill[] = [];
      const result = calculateRangeSummary(bills);
      expect(result).toEqual({
        lunch: {
          rawFoodTotal: 0,
          rawDrinkTotal: 0,
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
        dayTotalEarnings: 0
      });
    });
  });
});

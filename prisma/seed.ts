// prisma/seed.ts
import { PrismaClient, MealType } from '@prisma/client';
import { addDays, subMonths, getDay } from 'date-fns';

const prisma = new PrismaClient();

// Lunch Price Points
const lunchBasePrices = [1300, 1400];
const lunchAddonPrices = [250, 300];

// Drink Price
const drinkPrice = 450;

// Dinner Food Price Points
const dinnerFoodPrices = [250, 300, 400];

async function main() {
  console.log('Seeding the database with realistic pricing...');

  const today = new Date();
  const startDate = subMonths(today, 1);

  const billsData = [];

  for (let i = 0; i < 30; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = getDay(currentDate);

    // --- Lunch Entries (Wed/Thu focus) ---
    if (dayOfWeek === 3 || dayOfWeek === 4) {
      const numLunchBills = Math.floor(Math.random() * 2) + 1; // 1 or 2 lunch bills
      for (let j = 0; j < numLunchBills; j++) {
        let foodAmount = lunchBasePrices[Math.floor(Math.random() * lunchBasePrices.length)];
        const numAddons = Math.floor(Math.random() * 3); // 0 to 2 addons
        for (let k = 0; k < numAddons; k++) {
          foodAmount += lunchAddonPrices[Math.floor(Math.random() * lunchAddonPrices.length)];
        }
        const numDrinks = Math.floor(Math.random() * 3); // 0 to 2 drinks
        const drinkAmount = numDrinks * drinkPrice;

        billsData.push({
          date: currentDate,
          mealType: MealType.LUNCH,
          foodAmount: foodAmount,
          drinkAmount: drinkAmount,
          isOurFood: true,
          numberOfPeopleWorkingDinner: 1,
          comments: 'Wednesday/Thursday Lunch',
        });
      }
    } else if (Math.random() < 0.05) { // Small chance of lunch on other days
      let foodAmount = lunchBasePrices[Math.floor(Math.random() * lunchBasePrices.length)];
      const numAddons = Math.floor(Math.random() * 2);
      for (let k = 0; k < numAddons; k++) {
        foodAmount += lunchAddonPrices[Math.floor(Math.random() * lunchAddonPrices.length)];
      }
      const drinkAmount = Math.floor(Math.random() * 2) * drinkPrice;

      billsData.push({
        date: currentDate,
        mealType: MealType.LUNCH,
        foodAmount: foodAmount,
        drinkAmount: drinkAmount,
        isOurFood: Math.random() < 0.7,
        numberOfPeopleWorkingDinner: 1,
        comments: 'Occasional Lunch',
      });
    }

    // --- Dinner Entries ---
    const numDinnerBills = Math.floor(Math.random() * 3) + 1; // 1 to 3 dinner bills
    for (let j = 0; j < numDinnerBills; j++) {
      let foodAmount = 0;
      const numFoodItems = Math.floor(Math.random() * 3) + 1; // 1 to 3 food items
      for (let k = 0; k < numFoodItems; k++) {
        foodAmount += dinnerFoodPrices[Math.floor(Math.random() * dinnerFoodPrices.length)];
      }
      const numDrinks = Math.floor(Math.random() * 4); // 0 to 3 drinks
      const drinkAmount = numDrinks * drinkPrice;
      const isOurFoodDinner = (dayOfWeek === 3 || dayOfWeek === 4) ? Math.random() < 0.7 : Math.random() < 0.3;
      const numberOfPeopleWorkingDinner = Math.floor(Math.random() * 3) + 1;

      billsData.push({
        date: currentDate,
        mealType: MealType.DINNER,
        foodAmount: foodAmount,
        drinkAmount: drinkAmount,
        isOurFood: isOurFoodDinner,
        numberOfPeopleWorkingDinner: numberOfPeopleWorkingDinner,
        comments: `Dinner service (Our Food: ${isOurFoodDinner ? 'Yes' : 'No'})`,
      });
    }
  }

  await prisma.bill.createMany({
    data: billsData,
  });

  console.log('Realistic pricing database seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
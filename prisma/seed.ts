// prisma/seed.ts
import { PrismaClient, MealType } from '@prisma/client';
import { addDays, subMonths, getDay } from 'date-fns';
import { AppConfig as DefaultAppConfig } from '../src/config/app'; // Import your default AppConfig (will be removed later)

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
  const startDate = subMonths(today, 1); // Start 1 month ago

  const billsData = [];
  const purchaseBillsData = []; // Array for purchase bills

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

    // --- Purchase Bill Entries (Add some random purchase bills) ---
    if (Math.random() < 0.6) { // 60% chance of a purchase bill on any given day
      const amount = Math.floor(Math.random() * (5000 - 500 + 1)) + 500; // Random amount between 500 and 5000
      const descriptions = ['Vegetables', 'Groceries', 'Meat', 'Drinks', 'Supplies'];
      const comments = ['From local market', 'Wholesale purchase', 'Online order', 'Emergency stock'];

      purchaseBillsData.push({
        date: currentDate,
        amount: amount,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        comments: Math.random() < 0.5 ? comments[Math.floor(Math.random() * comments.length)] : null,
      });
    }
  }

  await prisma.bill.createMany({
    data: billsData,
  });
  console.log('Realistic pricing database seeding completed.');

  // Add purchase bills
  await prisma.purchaseBill.createMany({
    data: purchaseBillsData,
  });
  console.log('Purchase bills seeding completed.');

  // --- Seed AppConfiguration ---
  console.log('Seeding initial AppConfiguration...');

  // Define the default configuration values based on your AppConfig
  const configToSeed = [
    { key: 'LUNCH_FOOD_BASE_INCOME', value: DefaultAppConfig.LUNCH_FOOD_BASE_INCOME, description: 'Base income for lunch food before overage calculation.' },
    { key: 'LUNCH_FOOD_OVERAGE_SHARE_PERCENT', value: DefaultAppConfig.LUNCH_FOOD_OVERAGE_SHARE_PERCENT, description: 'Percentage of lunch food overage that contributes to earnings.' },
    { key: 'LUNCH_DRINK_SHARE_PERCENT', value: DefaultAppConfig.LUNCH_DRINK_SHARE_PERCENT, description: 'Percentage of lunch drink amount that contributes to earnings.' },
    { key: 'DINNER_FOOD_OUR_SHARE_PERCENT', value: DefaultAppConfig.DINNER_FOOD_OUR_SHARE_PERCENT, description: 'Percentage of dinner food earnings when it is "our food".' },
    { key: 'DINNER_FOOD_COMMON_POOL_PERCENT', value: DefaultAppConfig.DINNER_FOOD_COMMON_POOL_PERCENT, description: 'Percentage of dinner food that goes to the common pool.' },
    { key: 'DINNER_DRINK_COMMON_POOL_PERCENT', value: DefaultAppConfig.DINNER_DRINK_COMMON_POOL_PERCENT, description: 'Percentage of dinner drink that goes to the common pool.' },
  ];

  for (const configItem of configToSeed) {
    await prisma.appConfiguration.upsert({
      where: { key: configItem.key },
      update: { value: configItem.value, description: configItem.description },
      create: { key: configItem.key, value: configItem.value, description: configItem.description },
    });
  }

  console.log('AppConfiguration seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

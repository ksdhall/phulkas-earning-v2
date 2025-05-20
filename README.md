# Phulkas Earning App

This application helps manage and calculate daily and range-based earnings for "Phulkas" based on lunch and dinner bills, incorporating specific business logic for revenue sharing and common pool contributions.

## Features

* **User Authentication:** Secure login for authorized users.
* **Daily Dashboard:** View a summary of earnings for a selected date, categorized by lunch and dinner.
* **Bill Management:** Add, edit, and delete individual lunch and dinner bills.
* **Configurable Calculations:** Easily adjust key percentages and base incomes for earnings calculations via a central configuration file.
* **Internationalization (i18n):** Support for multiple languages (English and Japanese).
* **Responsive UI:** Optimized for various screen sizes using Material-UI.

---

## Setup

To get this project up and running locally:

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd phulkas-earning-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install # or yarn install
    ```
3.  **Set up your database:**
    * Ensure you have a PostgreSQL or SQLite database configured.
    * Create a `.env.local` file in the root directory and add your database connection string:
        ```
        DATABASE_URL="postgresql://user:password@host:port/database"
        # Or for SQLite:
        # DATABASE_URL="file:./dev.db"
        ```
    * Set up NextAuth.js secrets (replace with strong, random strings):
        ```
        NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
        NEXTAUTH_URL="http://localhost:3000" # Or your deployment URL
        ```
4.  **Generate Prisma Client and Push Schema:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```
    This will create your database tables based on `prisma/schema.prisma`.
5.  **Run the development server:**
    ```bash
    npm run dev # or yarn dev
    ```
    The application will be accessible at `http://localhost:3000`.

---

## Database Design Approach

The application uses Prisma as its Object-Relational Mapper (ORM) to interact with the database.

### `Bill` Model

The core data model is `Bill`, which stores details for each transaction.

```prisma
// prisma/schema.prisma
model Bill {
  id                          Int      @id @default(autoincrement())
  date                        DateTime
  mealType                    MealType
  foodAmount                  Float
  drinkAmount                 Float
  isOurFood                   Boolean  @default(true) // Relevant for Dinner calculations
  numberOfPeopleWorkingDinner Int      @default(1) // Relevant for Dinner calculations
}

enum MealType {
  LUNCH
  DINNER
}
```

* **`id`**: Unique identifier for each bill.
* **`date`**: The date of the bill (stored as `DateTime`, but treated as `YYYY-MM-DD` for calculations).
* **`mealType`**: An `Enum` (`LUNCH` or `DINNER`) to differentiate calculation logic.
* **`foodAmount`**: Total amount of food on the bill.
* **`drinkAmount`**: Total amount of drinks on the bill.
* **`isOurFood`**: A boolean flag, primarily used for dinner calculations, indicating if the food was provided by "us" (Phulkas).
* **`numberOfPeopleWorkingDinner`**: The number of people working during the dinner shift, used for common pool sharing.

---

## Calculation Logic

The earnings calculation is central to the application. Percentages and base incomes are defined in `src/config/app.ts` for easy configurability.

### `src/config/app.ts`

```typescript
export const AppConfig = {
  LUNCH_FOOD_BASE_INCOME: 8000,
  LUNCH_FOOD_OVERAGE_SHARE_PERCENT: 0.5, // 50%
  LUNCH_DRINK_SHARE_PERCENT: 0.5, // 50%

  DINNER_FOOD_OUR_SHARE_PERCENT: 0.75, // 75%
  DINNER_FOOD_COMMON_POOL_PERCENT: 0.25, // 25% (for food, always goes to common pool)
  DINNER_DRINK_COMMON_POOL_PERCENT: 0.25, // 25% (for drinks, always goes to common pool)
};
```

### Lunch Earnings Calculation

The `calculateLunchMealSummary` function determines Phulkas' share from lunch bills.

* **Food Earnings:**
    * A base income (`LUNCH_FOOD_BASE_INCOME`) is earned up to this amount.
    * Any amount exceeding the base income is considered "overage."
    * Phulkas earns the base income plus a configurable percentage (`LUNCH_FOOD_OVERAGE_SHARE_PERCENT`) of the overage.
    * *Formula:* `LUNCH_FOOD_BASE_INCOME + (max(0, rawFoodTotal - LUNCH_FOOD_BASE_INCOME) * LUNCH_FOOD_OVERAGE_SHARE_PERCENT)`
* **Drink Earnings:**
    * Phulkas earns a configurable percentage (`LUNCH_DRINK_SHARE_PERCENT`) of the total drink bill.
    * *Formula:* `rawDrinkTotal * LUNCH_DRINK_SHARE_PERCENT`
* **Total Lunch Earnings:** Sum of Food Earnings and Drink Earnings.

### Dinner Earnings Calculation

The `calculateDinnerMealSummary` function handles dinner bills, which involve a "common pool" concept and the `isOurFood` flag.

* **Direct Food Earnings (Phulkas' Direct Share):**
    * If `isOurFood` is `true`: Phulkas earns a configurable percentage (`DINNER_FOOD_OUR_SHARE_PERCENT`, e.g., 75%) directly from the `rawFoodTotal`.
    * If `isOurFood` is `false`: Phulkas earns `0` directly from the food bill.
* **Common Pool Contributions:**
    * **Food Contribution:** A configurable percentage (`DINNER_FOOD_COMMON_POOL_PERCENT`, e.g., 25%) of the `rawFoodTotal` *always* goes into the common pool, regardless of `isOurFood`.
    * **Drink Contribution:** A configurable percentage (`DINNER_DRINK_COMMON_POOL_PERCENT`, e.g., 25%) of the `rawDrinkTotal` *always* goes into the common pool.
* **Total Common Pool:** Sum of Food Contribution and Drink Contribution to the common pool.
* **Our Share from Common Pool:** The `Total Common Pool` is divided equally among the `numberOfPeopleWorkingDinner`.
    * *Formula:* `Total Common Pool / max(1, numberOfPeopleWorkingDinner)`
* **Total Dinner Earnings:** Sum of `Direct Food Earnings` and `Our Share from Common Pool`.

### Daily Aggregation

The `calculateDailyEarnings` function aggregates all lunch and dinner bills for a given day. For dinner, it first sums up all `rawFoodTotal` and `rawDrinkTotal` for that day, and then applies the `calculateDinnerMealSummary` logic *once* to these aggregated totals, using the `isOurFood` and `numberOfPeopleWorkingDinner` values from the *last* recorded dinner bill for that day (or a default if no dinner bills). This ensures common pool calculations are correct across multiple dinner entries on a single day.

---

## UI/UX Specifications

* **Responsive Design:** The application is built with Material-UI and designed to be fully responsive, adapting to mobile, tablet, and desktop screens.
* **Consistent Modals:** "Add Bill" and "Edit Bill" functionalities are handled via a single, consistent modal dialog for a smoother user experience, avoiding page navigations for form interactions.
* **Clear Currency Formatting:** All currency amounts are formatted with the Yen symbol (`¥`) and locale-specific thousands separators.
* **Date Navigation:** Easy navigation between days on the dashboard using arrow buttons.
* **Loading Indicators:** Clear loading spinners are displayed during data fetches and form submissions.
* **Error Handling:** User-friendly error messages are displayed for API failures or validation issues.

---

## API Endpoints

The application interacts with the backend via Next.js API Routes.

* `POST /api/bills`: Create a new bill.
* `GET /api/bills`: Fetch all bills.
* `GET /api/bills/[id]`: Fetch a single bill by ID.
* `PUT /api/bills/[id]`: Update a bill by ID.
* `DELETE /api/bills/[id]`: Delete a bill by ID.
* `GET /api/reports?from={date}&to={date}`: Fetch bills within a specified date range (used for daily summaries).

---

## Internationalization (i18n)

The application uses `next-intl` for internationalization.

* Translation files are located in the `messages/` directory (e.g., `messages/en.json`, `messages/ja.json`).
* Currency symbols (`¥`) are *not* embedded in the translation strings; they are added at runtime by the `formatCurrency` utility function to prevent duplication.

---

## Future Enhancements

* **User Management:** More robust user roles and permissions.
* **Analytics/Reporting:** Advanced reports (e.g., monthly summaries, trend analysis).
* **Configurable UI for Percentages:** Allow administrators to change `AppConfig` values directly through the UI.
* **Bill Filtering/Sorting:** More extensive options for filtering and sorting bills in the list.
* **Offline Support:** Implement service workers for basic offline functionality.
* **Unit Testing:** Add comprehensive unit tests for calculation logic and components.

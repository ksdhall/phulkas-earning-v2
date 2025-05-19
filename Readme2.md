# Phulkas Earning Application Documentation

This document outlines the requirements, calculation logic, and design specifications for the Phulkas Earning Application, based on the features and structure implemented.

## 1. Detailed Requirements and Calculation Logics

The primary goal of this application is to allow Phulkas to track their earnings from lunch and dinner bills, providing a clear summary for individual days and selected date ranges.

### Core Data Points per Bill:

For each bill entry, the following information is captured:

* **Date:** The date the bill occurred (formatted as `yyyy-MM-dd`).
* **Meal Type:** Whether the bill was for 'Lunch' or 'Dinner'.
* **Food Amount:** The total amount earned from food for this bill.
* **Drink Amount:** The total amount earned from drinks for this bill.
* **Is Our Food? (Dinner Only):** A flag (Yes/No) indicating if the food sold during this dinner bill was specifically "Our Food" (as per a specific internal rule). This field is optional for Lunch.
* **Number of People Working Dinner (Dinner Only):** The number of people working the dinner shift for this bill. This field is optional for Lunch and relevant for sharing calculations when "Is Our Food?" is No.

### Calculation Logics:

The application calculates earnings based on different rules for Lunch and Dinner.

#### Lunch Earnings:

Lunch earnings are calculated based on a base food amount threshold of **¥8000** and the total drink amount.

* **Food Earnings:** 50% of the food amount **above** the base food threshold of **¥8000**. If the food amount is below or equal to the **¥8000** threshold, food earnings are ¥0.
    * Formula: `max(0, Food Amount - 8000) * 0.5`
* **Drink Earnings:** 50% of the total drink amount.
    * Formula: `Drink Amount * 0.5`
* **Total Lunch Earnings:** Food Earnings + Drink Earnings.

#### Dinner Earnings:

Dinner earnings calculations depend on whether the food was marked as "Is Our Food?".

* **If "Is Our Food?" is Yes:**
    * **Food Earnings:** 75% of the total food amount.
        * Formula: `Food Amount * 0.75`
    * **Drink Earnings:** 50% of the total drink amount.
        * Formula: `Drink Amount * 0.5`
    * **Total Dinner Earnings:** Food Earnings + Drink Earnings.
* **If "Is Our Food?" is No:**
    * **Food Shift Share Pool:** 25% of the total food amount.
        * Formula: `Food Amount * 0.25`
    * **Food Earnings Share:** Food Shift Share Pool divided by the "Number of People Working Dinner". This amount is the individual's share from the shared pool. (Assumes Number of People Working Dinner is at least 1).
        * Formula: `(Food Amount * 0.25) / Number of People Working Dinner`
    * **Drink Earnings:** 50% of the total drink amount (this is not shared).
        * Formula: `Drink Amount * 0.5`
    * **Total Dinner Earnings:** Food Earnings Share + Drink Earnings.

#### Daily Total Earnings:

The total earnings for a single day are the sum of the Total Lunch Earnings and the Total Dinner Earnings for all bills recorded on that specific date.

#### Range Total Earnings:

The total earnings for a selected date range are the sum of the Daily Total Earnings for every day within that range.

## 2. Design Specs (including Database)

The application follows a modern web development architecture using Next.js App Router, integrating several libraries for UI, state management, data fetching, and database interaction.

### Core Entities:

* **User:** Represents a user who can log in to access and manage bills. (Authentication handled via NextAuth.js).
* **Bill:** Represents a single record of earnings for a meal on a specific date.

### Database Schema (Prisma - based on `src/lib/db.ts`):

The `Bill` model in the Prisma schema (likely `prisma/schema.prisma`) should have the following fields:

```prisma
model Bill {
  id                          Int       @id @default(autoincrement())
  date                        DateTime  // Date of the bill
  mealType                    MealType  // Enum: LUNCH, DINNER
  foodAmount                  Float     // Amount from food
  drinkAmount                 Float     // Amount from drinks
  isOurFood                   Boolean?  // Optional for dinner bills (nullable)
  numberOfPeopleWorkingDinner Int?      // Optional for dinner bills (nullable)
  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
}

enum MealType {
  LUNCH
  DINNER
}
```

**Note:** The `mealType` Enum values are typically uppercase in Prisma.

### Technology Stack:

* **Framework:** Next.js (with App Router)
* **Frontend:** React
* **UI Components:** Material UI (MUI)
* **Styling:** MUI's `sx` prop, CSS Modules (`globals.css`)
* **State Management:** React's `useState`, `useEffect`, `useMemo`, `useCallback` hooks for local component state and derived values.
* **Authentication:** NextAuth.js
* **Internationalization (i18n):** `next-intl`
* **Date Handling:** `date-fns`
* **Database:** Prisma ORM to interact with the database (e.g., SQLite, PostgreSQL, MySQL).
* **Data Fetching:** Next.js API Routes (`app/api/...`)
* **File Structure:** Standard Next.js App Router structure (`app/[locale]/...`, `components/...`, `lib/...`, `i18n/...`).

### Application Flow:

1.  **Authentication:** Users log in via a login page (`app/[locale]/page.tsx` split into Client/Server components). Authentication state managed by NextAuth.js and accessed via `useSession`.
2.  **Protected Routes:** Pages like Dashboard, Add Bill, and Summary are protected, redirecting unauthenticated users.
3.  **Add Bill Page (`app/[locale]/add-bill/page.tsx`):**
    * Displays a form (`BillForm` component).
    * Form handles input for date, meal type, food/drink amounts, and dinner-specific fields.
    * Submits data to an API route (`app/api/bills`).
4.  **Summary Page (`app/[locale]/summary/page.tsx`):**
    * Allows selecting a date range using a `DateRangeFilter` component (handles date inputs).
    * An "Apply Filter" button triggers data fetching for the selected range via an API route (`app/api/reports`).
    * Displays a summary card showing total food, drink, and Phulka's earnings for the selected range.
    * Displays a table of daily summaries within the range (rendering daily summaries/calculations).
    * Lists individual bills within the range (`BillList` component).
    * Provides options to edit or delete bills (calling API routes `app/api/bills/[id]`).
5.  **Edit Bill Page (`app/[locale]/edit/[id]/page.tsx`):**
    * Fetches existing bill data based on the ID from URL parameters.
    * Populates the `BillForm` with existing data.
    * Allows updating the bill (calling API route `app/api/bills/[id]`).
    * Allows deleting the bill from the edit page.
6.  **Layout (`app/[locale]/layout.tsx`):**
    * Provides a consistent navigation bar (`AppBar`) with links (Dashboard, Add Bill, Summary, Sign Out).
    * Includes `LanguageSwitcher` and `ThemeToggleButton` components.
    * Wraps content with necessary providers (`AuthProvider`, `NextIntlClientProvider`, `AppThemeProvider`). Client component wrappers (`ThemeProviderWrapper`) are used in the Server Component layout for providers that use client-side hooks.
7.  **API Routes (`app/api/...`):**
    * Handle incoming requests for creating, reading, updating, and deleting bills, interacting with the database via Prisma (`lib/db.ts`).
    * `/api/bills`: POST (create), GET (all bills - though filtering is often done in /api/reports).
    * `/api/bills/[id]`: GET (single bill), PUT (update), DELETE (delete).
    * `/api/reports`: GET (bills and summary for a date range).

## 3. Prompt for Starting New Development

If you decide that troubleshooting the current project state is too difficult and want to start with a clean base based on these requirements, you can use this prompt to explain the project and ask for code generation:

```
I need help building a Next.js 14 application with App Router, TypeScript, and Material UI (MUI v5 or v7). The application tracks earnings from restaurant bills for "Phulkas".

Here are the core requirements, calculation rules, and the desired database schema using Prisma:

**Core Requirements:**
- User authentication (login/logout).
- Ability to add new bill entries with: Date, Meal Type (Lunch/Dinner), Food Amount, Drink Amount.
- For Dinner bills, capture two optional fields: "Is Our Food?" (boolean, Yes/No) and "Number of People Working Dinner" (number).
- View a list of all bills.
- Edit existing bill entries.
- Delete existing bill entries.
- View a summary of earnings for a selected date range.
- View a table of daily earnings summaries within a selected date range.
- Internationalization (i18n) with multiple locales (e.g., English, Japanese).
- Light/Dark theme toggle.

**Calculation Logics:**
- **Lunch Earnings:**
  - Food earnings: 50% of food amount *above* a ¥8000 threshold (0 if below).
  - Drink earnings: 50% of total drink amount.
  - Total Lunch Earnings = max(0, Food Amount - 8000) * 0.5 + Drink Amount * 0.5
- **Dinner Earnings:**
  - If "Is Our Food?" is Yes: Food Amount * 0.75 + Drink Amount * 0.5
  - If "Is Our Food?" is No: (Food Amount * 0.25) / Number of People Working Dinner + Drink Amount * 0.5
- **Daily Total Earnings:** Sum of Total Lunch and Total Dinner earnings for a day.
- **Range Total Earnings:** Sum of Daily Total Earnings across the selected range.

**Database Schema (Prisma):**

```prisma
model Bill {
  id                          Int       @id @default(autoincrement())
  date                        DateTime
  mealType                    MealType
  foodAmount                  Float
  drinkAmount                 Float
  isOurFood                   Boolean?
  numberOfPeopleWorkingDinner Int?
  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
}

enum MealType {
  LUNCH
  DINNER
}
```

**Technical Details:**
- Use Next.js App Router.
- Use TypeScript.
- Use Material UI for components.
- Use Prisma for database interaction.
- Use NextAuth.js for authentication.
- Use `next-intl` for internationalization.
- Use `date-fns` for date handling.
- Structure the application using Server and Client Components appropriately. Context providers (like Auth, i18n, Theme) used in the layout should be within Client Component wrappers.

Please help me build the necessary files for this application, starting with the core components and pages. I will need code for:
- The Prisma schema (`prisma/schema.prisma`).
- The database client and functions (`lib/db.ts`).
- The authentication configuration and handler (`auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `components/AuthProvider.tsx`).
- The i18n configuration (`i18n.ts`, `i18n/routing.ts`, message files).
- The theme context and provider (`context/ThemeContext.tsx`, `components/ThemeProviderWrapper.tsx`).
- The root layout (`app/layout.tsx`, `app/[locale]/layout.tsx`).
- The login page (`app/[locale]/page.tsx` split into Client/Server components).
- The add bill page (`app/[locale]/add-bill/page.tsx` and the `BillForm` component).
- The summary page (`app/[locale]/summary/page.tsx` split into Client/Server components for data fetching/rendering, `DateRangeFilter`, `DailySummaryCard`, `BillList` components).
- API routes for bills and reports (`app/api/bills/route.ts`, `app/api/bills/[id]/route.ts`, `app/api/reports/route.ts`).
- Basic types (`types/Bill.ts`, etc.).
- Calculation logic (`lib/calculations.ts`).
- Utility components like `LanguageSwitcher` and `ThemeToggleButton`.

Please provide the code for these files, explaining the purpose of each and how they fit together.

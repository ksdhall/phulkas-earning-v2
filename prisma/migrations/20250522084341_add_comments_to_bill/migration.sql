-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "foodAmount" REAL NOT NULL,
    "drinkAmount" REAL NOT NULL,
    "mealType" TEXT NOT NULL DEFAULT 'LUNCH',
    "isOurFood" BOOLEAN DEFAULT true,
    "numberOfPeopleWorkingDinner" INTEGER DEFAULT 1,
    "comments" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bill" ("createdAt", "date", "drinkAmount", "foodAmount", "id", "isOurFood", "mealType", "numberOfPeopleWorkingDinner", "updatedAt") SELECT "createdAt", "date", "drinkAmount", "foodAmount", "id", "isOurFood", "mealType", "numberOfPeopleWorkingDinner", "updatedAt" FROM "Bill";
DROP TABLE "Bill";
ALTER TABLE "new_Bill" RENAME TO "Bill";
CREATE INDEX "Bill_date_idx" ON "Bill"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "comments" TEXT
);

-- CreateTable
CREATE TABLE "biz_payment_plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "expectedAmount" DECIMAL NOT NULL DEFAULT 0,
    "expectedDate" DATETIME,
    "condition" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNMET',
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_payment_plan_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "biz_contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

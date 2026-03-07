/*
  Warnings:

  - Added the required column `deptId` to the `biz_project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deptName` to the `biz_project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pmName` to the `biz_project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serialNo` to the `biz_project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `biz_project` table without a default value. This is not possible if the table is not empty.
  - Made the column `pmId` on table `biz_project` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_biz_project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deptId" TEXT NOT NULL,
    "deptName" TEXT NOT NULL,
    "pmId" TEXT NOT NULL,
    "pmName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "biz_customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_biz_project" ("createdAt", "customerId", "id", "name", "pmId", "updatedAt") SELECT "createdAt", "customerId", "id", "name", "pmId", "updatedAt" FROM "biz_project";
DROP TABLE "biz_project";
ALTER TABLE "new_biz_project" RENAME TO "biz_project";
CREATE UNIQUE INDEX "biz_project_serialNo_key" ON "biz_project"("serialNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

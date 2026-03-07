-- CreateTable
CREATE TABLE "biz_project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pmId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "biz_customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "signDate" DATETIME,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "pmId" TEXT NOT NULL,
    "pmName" TEXT NOT NULL,
    "deptId" TEXT NOT NULL,
    "deptName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "biz_customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "biz_contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "biz_project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "biz_contract_serialNo_key" ON "biz_contract"("serialNo");

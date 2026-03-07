-- CreateTable
CREATE TABLE "biz_customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "creditLevel" TEXT NOT NULL DEFAULT 'A',
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "taxNumber" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "biz_customer_name_key" ON "biz_customer"("name");

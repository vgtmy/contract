-- CreateTable
CREATE TABLE "biz_contract_file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "uploaderName" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_contract_file_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "biz_contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

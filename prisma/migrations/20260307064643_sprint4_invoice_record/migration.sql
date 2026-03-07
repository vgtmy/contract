-- CreateTable
CREATE TABLE "biz_invoice_record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL DEFAULT 'VAT_SPECIAL',
    "amountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxRate" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "billingDate" DATETIME NOT NULL,
    "title" TEXT,
    "remark" TEXT,
    "handlerId" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_invoice_record_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "biz_contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

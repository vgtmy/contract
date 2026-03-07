-- CreateTable
CREATE TABLE "biz_receipt_record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "planId" TEXT,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "receiptDate" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "voucherNo" TEXT,
    "handlerId" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "biz_receipt_record_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "biz_contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "biz_receipt_record_planId_fkey" FOREIGN KEY ("planId") REFERENCES "biz_payment_plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

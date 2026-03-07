-- CreateTable
CREATE TABLE "sys_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "deptName" TEXT,
    "role" TEXT,
    "module" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "actionTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

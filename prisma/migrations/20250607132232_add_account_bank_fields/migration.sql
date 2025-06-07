-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "statementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "idx_transaction_duplicate" ON "Transaction"("date", "description", "amount", "type");

-- CreateIndex
CREATE INDEX "idx_statement_duplicate" ON "Statement"("fileName", "fileSize");

-- CreateIndex
CREATE INDEX "idx_statement_hash" ON "Statement"("fileHash");

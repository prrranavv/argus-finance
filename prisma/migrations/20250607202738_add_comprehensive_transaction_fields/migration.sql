-- AlterTable
ALTER TABLE "Statement" ADD COLUMN "fileContent" BLOB;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "creditLimit" REAL;
ALTER TABLE "Transaction" ADD COLUMN "dueDate" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "merchantCategory" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "mode" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "openingBalance" REAL;
ALTER TABLE "Transaction" ADD COLUMN "rewardPoints" REAL;
ALTER TABLE "Transaction" ADD COLUMN "runningBalance" REAL;

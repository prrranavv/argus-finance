import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'duplicates' or 'all'

    if (action === 'all') {
      // Delete all transactions and statements
      const deletedTransactions = await prisma.transaction.deleteMany();
      const deletedStatements = await prisma.statement.deleteMany();

      return NextResponse.json({
        success: true,
        message: `Deleted all data: ${deletedTransactions.count} transactions and ${deletedStatements.count} statements`,
        transactionsDeleted: deletedTransactions.count,
        statementsDeleted: deletedStatements.count
      });
    } else {
      // Just clear duplicates (existing functionality)
      const transactions = await prisma.transaction.findMany({
        orderBy: [
          { date: 'asc' },
          { description: 'asc' },
          { amount: 'asc' },
          { type: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      const duplicates = [];
      const seen = new Set();

      for (const transaction of transactions) {
        const key = `${transaction.date.toISOString()}-${transaction.description}-${transaction.amount}-${transaction.type}`;
        
        if (seen.has(key)) {
          duplicates.push(transaction.id);
        } else {
          seen.add(key);
        }
      }

      // Delete duplicate transactions (keeping the first occurrence of each)
      const deleteResult = await prisma.transaction.deleteMany({
        where: {
          id: {
            in: duplicates
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Removed ${deleteResult.count} duplicate transactions`,
        duplicatesRemoved: deleteResult.count
      });
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup operation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
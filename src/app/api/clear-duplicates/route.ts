import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Find duplicate transactions based on date, description, amount, and type
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

  } catch (error) {
    console.error('Error clearing duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to clear duplicates' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
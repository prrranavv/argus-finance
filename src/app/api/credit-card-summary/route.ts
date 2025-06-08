import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getMonthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedCard = searchParams.get('card') || 'Total';

    // Fetch credit card transactions
    const whereClause: Record<string, string> = {
      accountType: 'Credit Card'
    };

    // Filter by specific card if not Total
    if (selectedCard !== 'Total') {
      whereClause.bankName = selectedCard;
    }

    const creditCardTransactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc'
      }
    });

    if (creditCardTransactions.length === 0) {
      return NextResponse.json([]);
    }

    // Group transactions by month and calculate spending
    const monthlySpending: { [month: string]: number } = {};

    creditCardTransactions.forEach(transaction => {
      const monthKey = getMonthKey(new Date(transaction.date));
      
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = 0;
      }
      
      // Add expense amounts (positive numbers represent money spent)
      if (transaction.type === 'expense') {
        monthlySpending[monthKey] += transaction.amount;
      }
    });

    // Convert to array format and sort by date
    const sortedData = Object.entries(monthlySpending)
      .map(([month, amount]) => ({
        month,
        amount: Math.round(amount)
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Error fetching credit card summary:', error);
    return NextResponse.json({ error: 'Failed to fetch credit card summary' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
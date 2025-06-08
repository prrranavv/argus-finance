import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getMonthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export async function GET() {
  try {
    // Fetch all credit card transactions
    const creditCardTransactions = await prisma.transaction.findMany({
      where: {
        accountType: 'Credit Card'
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (creditCardTransactions.length === 0) {
      return NextResponse.json([]);
    }

    // Group transactions by credit card and month to calculate spending amounts
    const cardSpending: { [card: string]: { [month: string]: number } } = {};
    const allMonths = new Set<string>();

    creditCardTransactions.forEach(transaction => {
      const monthKey = getMonthKey(new Date(transaction.date));
      const cardName = transaction.bankName;
      
      if (!cardSpending[cardName]) {
        cardSpending[cardName] = {};
      }
      
      // Sum up all transaction amounts for the month (absolute values for spending)
      if (!cardSpending[cardName][monthKey]) {
        cardSpending[cardName][monthKey] = 0;
      }
      
      // Add absolute amount for credit card spending
      cardSpending[cardName][monthKey] += Math.abs(transaction.amount || 0);
      allMonths.add(monthKey);
    });

    // Convert to array format for the chart
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    const result = sortedMonths.map(month => {
      const monthData: Record<string, number | string> = { week: month };
      
      // Calculate total for all cards
      let total = 0;
      Object.keys(cardSpending).forEach(cardName => {
        const amount = cardSpending[cardName][month] || 0;
        monthData[cardName] = amount;
        total += amount;
      });
      
      monthData.Total = total;
      
      return monthData;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching credit card progression:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit card progression' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
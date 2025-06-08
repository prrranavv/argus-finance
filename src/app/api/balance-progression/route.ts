import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all bank account transactions (excluding credit card)
    const bankTransactions = await prisma.transaction.findMany({
      where: {
        accountType: 'Bank Account'
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (bankTransactions.length === 0) {
      return NextResponse.json([]);
    }

    // Group transactions by bank and month
    const bankBalances: { [bank: string]: { [month: string]: { balance: number | null; date: Date } } } = {};
    
    bankTransactions.forEach(transaction => {
      const monthKey = getMonthKey(new Date(transaction.date));
      const bankName = transaction.bankName;
      
      if (!bankBalances[bankName]) {
        bankBalances[bankName] = {};
      }
      
      // Use the latest closing balance for each bank-month combination
      // If same date, use the higher balance (more recent transaction on same day)
      const currentEntry = bankBalances[bankName][monthKey];
      if (!currentEntry || 
          new Date(transaction.date) > currentEntry.date ||
          (new Date(transaction.date).getTime() === currentEntry.date.getTime() && 
           transaction.closingBalance !== null && transaction.closingBalance > (currentEntry.balance || 0))) {
        bankBalances[bankName][monthKey] = {
          balance: transaction.closingBalance,
          date: new Date(transaction.date)
        };
      }
    });

    // Get all unique months and sort them
    const allMonths = new Set<string>();
    Object.values(bankBalances).forEach(bankData => {
      Object.keys(bankData).forEach(month => allMonths.add(month));
    });
    const sortedMonths = Array.from(allMonths).sort();

    // Create progression data for chart
    const balanceProgression = sortedMonths.map(monthKey => {
      const monthData: Record<string, number | string | null> = {
        month: monthKey
      };

      let totalBalance = 0;
      let hasAnyBalance = false;

      // Add balance for each bank
      Object.entries(bankBalances).forEach(([bankName, bankData]) => {
        if (bankData[monthKey] && bankData[monthKey].balance !== null) {
          const balance = Math.round(bankData[monthKey].balance!);
          monthData[bankName] = balance;
          totalBalance += balance;
          hasAnyBalance = true;
        } else {
          monthData[bankName] = null;
        }
      });

      // Add total balance
      monthData.Total = hasAnyBalance ? totalBalance : null;
      
      // Get date for formatting
      const dateForMonth = Object.values(bankBalances)
        .map(bankData => bankData[monthKey]?.date)
        .filter(date => date !== undefined)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      if (dateForMonth) {
        monthData.week = formatMonthLabel(dateForMonth);
      }

      return monthData;
    }).filter(item => item.week); // Only include months with valid dates

    return NextResponse.json(balanceProgression);
  } catch (error) {
    console.error('Error fetching balance progression:', error);
    return NextResponse.json({ error: 'Failed to fetch balance progression' }, { status: 500 });
  }
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
} 
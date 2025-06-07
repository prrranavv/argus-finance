import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankFilter = searchParams.get('bank'); // 'Total', 'HDFC', 'Axis', etc.

    // Fetch all transactions with closing balance, ordered by date
    const transactions = await prisma.transaction.findMany({
      where: bankFilter && bankFilter !== 'Total' ? {
        bankName: bankFilter
      } as any : undefined,
      orderBy: { date: 'asc' },
      include: {
        statement: true
      }
    });

    if (transactions.length === 0) {
      return NextResponse.json([]);
    }

    if (bankFilter === 'Total') {
      // For Total tab, group by bank and month, then aggregate
      const bankMonthlyData = new Map<string, Map<string, {
        month: string;
        accountBalance: number | null;
        credited: number;
        debited: number;
        totalCreditBill: number;
      }>>();

      // Get all transactions for aggregation
      const allTransactions = await prisma.transaction.findMany({
        orderBy: { date: 'asc' },
        include: { statement: true }
      });

      allTransactions.forEach(transaction => {
        const bankName = (transaction as any).bankName || 'Unknown';
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!bankMonthlyData.has(bankName)) {
          bankMonthlyData.set(bankName, new Map());
        }

        const bankData = bankMonthlyData.get(bankName)!;
        if (!bankData.has(monthKey)) {
          bankData.set(monthKey, {
            month: monthName,
            accountBalance: null,
            credited: 0,
            debited: 0,
            totalCreditBill: 0
          });
        }

        const monthData = bankData.get(monthKey)!;

        // Update account balance with the latest closing balance for the month (only for Bank Account)
        if ((transaction as any).closingBalance !== null && (transaction as any).accountType === 'Bank Account') {
          monthData.accountBalance = (transaction as any).closingBalance;
        }

        // Calculate credited and debited amounts based on transaction type
        if (transaction.type === 'income') {
          monthData.credited += transaction.amount;
        } else if (transaction.type === 'expense' && (transaction as any).accountType !== 'Credit Card') {
          // Only count bank account expenses as debited, exclude credit card expenses
          monthData.debited += transaction.amount;
        }

        // Calculate credit card bills - expenses from Credit Card accounts
        if ((transaction as any).accountType === 'Credit Card' && transaction.type === 'expense') {
          monthData.totalCreditBill += transaction.amount;
        }
      });

      // Aggregate data across all banks for each month
      const totalMonthlyData = new Map<string, {
        month: string;
        accountBalance: number | null;
        credited: number;
        debited: number;
        totalCreditBill: number;
      }>();

      bankMonthlyData.forEach(bankData => {
        bankData.forEach((monthData, monthKey) => {
          if (!totalMonthlyData.has(monthKey)) {
            totalMonthlyData.set(monthKey, {
              month: monthData.month,
              accountBalance: 0,
              credited: 0,
              debited: 0,
              totalCreditBill: 0
            });
          }

          const totalData = totalMonthlyData.get(monthKey)!;
          totalData.credited += monthData.credited;
          totalData.debited += monthData.debited;
          totalData.totalCreditBill += monthData.totalCreditBill;
          
          if (monthData.accountBalance !== null) {
            totalData.accountBalance = (totalData.accountBalance || 0) + monthData.accountBalance;
          }
        });
      });

      const result = Array.from(totalMonthlyData.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([_, data]) => data);

      return NextResponse.json(result);
    } else {
      // For individual bank tabs
      const monthlyData = new Map<string, {
        month: string;
        accountBalance: number | null;
        credited: number;
        debited: number;
        totalCreditBill: number;
      }>();

      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthName,
            accountBalance: null,
            credited: 0,
            debited: 0,
            totalCreditBill: 0
          });
        }

        const monthData = monthlyData.get(monthKey)!;

        // Update account balance with the latest closing balance for the month (only for Bank Account)
        if ((transaction as any).closingBalance !== null && (transaction as any).accountType === 'Bank Account') {
          monthData.accountBalance = (transaction as any).closingBalance;
        }

        // Calculate credited and debited amounts based on transaction type
        if (transaction.type === 'income') {
          monthData.credited += transaction.amount;
        } else if (transaction.type === 'expense' && (transaction as any).accountType !== 'Credit Card') {
          // Only count bank account expenses as debited, exclude credit card expenses
          monthData.debited += transaction.amount;
        }

        // Calculate credit card bills - expenses from Credit Card accounts
        if ((transaction as any).accountType === 'Credit Card' && transaction.type === 'expense') {
          monthData.totalCreditBill += transaction.amount;
        }
      });

      const result = Array.from(monthlyData.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([_, data]) => data);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly summary' },
      { status: 500 }
    );
  }
} 
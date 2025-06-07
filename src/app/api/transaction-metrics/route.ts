import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get date 60 days ago for comparison (30 days before the last 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Fetch transactions for last 30 days
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Fetch transactions for previous 30 days (31-60 days ago) for comparison
    const previousTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });

    // Calculate current period metrics
    const totalTransactions = recentTransactions.length;
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const dailyAvgSpending = totalExpenses / 30;
    const avgTransactionAmount = totalTransactions > 0 ? totalExpenses / recentTransactions.filter(t => t.type === 'expense').length : 0;

    // Calculate previous period metrics for comparison
    const prevTotalTransactions = previousTransactions.length;
    const prevTotalExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const prevDailyAvgSpending = prevTotalExpenses / 30;
    const prevAvgTransactionAmount = prevTotalTransactions > 0 ? prevTotalExpenses / previousTransactions.filter(t => t.type === 'expense').length : 0;

    // Calculate percentage changes
    const expenseChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    const transactionCountChange = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
    const dailySpendingChange = prevDailyAvgSpending > 0 ? ((dailyAvgSpending - prevDailyAvgSpending) / prevDailyAvgSpending) * 100 : 0;
    const avgTransactionChange = prevAvgTransactionAmount > 0 ? ((avgTransactionAmount - prevAvgTransactionAmount) / prevAvgTransactionAmount) * 100 : 0;

    // Find top 3 expenses in last 30 days
    const topExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map(t => ({
        merchant: t.description,
        amount: t.amount,
        date: t.date
      }));

    // Get last 3 months of Quizizz salary data (not including current period)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const allQuizizzTransactions = await prisma.transaction.findMany({
      where: {
        type: 'income',
        description: {
          contains: 'quizizz'
        },
        date: {
          gte: fourMonthsAgo,
          lt: thirtyDaysAgo // Exclude current 30-day period
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group by month and sum up salaries
    const salaryByMonth = allQuizizzTransactions.reduce((acc: Record<string, {total: number, transactions: any[]}>, t) => {
      const monthKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, transactions: [] };
      }
      acc[monthKey].total += t.amount;
      acc[monthKey].transactions.push(t);
      return acc;
    }, {});

    const last3MonthsSalary = Object.entries(salaryByMonth)
      .map(([month, data]) => ({
        month,
        amount: data.total,
        date: data.transactions[0].date // Use the date of the first transaction in that month
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    // Category breakdown (top 5)
    const categoryBreakdown = recentTransactions
      .filter(t => t.type === 'expense' && t.category)
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category!] = (acc[t.category!] || 0) + t.amount;
        return acc;
      }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));

    // Detect recurring payments (transactions with similar descriptions)
    const descriptionGroups = recentTransactions.reduce((acc: Record<string, any[]>, t) => {
      // Normalize description for pattern matching
      const normalizedDesc = t.description.toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim();
      
      if (normalizedDesc.length > 3) { // Ignore very short descriptions
        acc[normalizedDesc] = acc[normalizedDesc] || [];
        acc[normalizedDesc].push(t);
      }
      return acc;
    }, {});

    const recurringPayments = Object.entries(descriptionGroups)
      .filter(([, transactions]) => transactions.length >= 2) // At least 2 transactions
      .map(([pattern, transactions]) => ({
        pattern: transactions[0].description.split(' ').slice(0, 3).join(' '), // First 3 words
        count: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        avgAmount: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
        lastDate: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))),
        category: transactions[0].category,
        type: transactions[0].type
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      period: {
        start: thirtyDaysAgo,
        end: new Date(),
        days: 30
      },
      metrics: {
        totalExpenses: {
          current: totalExpenses,
          previous: prevTotalExpenses,
          change: expenseChange
        },
        dailyAvgSpending: {
          current: dailyAvgSpending,
          previous: prevDailyAvgSpending,
          change: dailySpendingChange
        },
        avgTransaction: {
          current: avgTransactionAmount,
          previous: prevAvgTransactionAmount,
          change: avgTransactionChange
        },
        totalTransactions: {
          current: totalTransactions,
          previous: prevTotalTransactions,
          change: transactionCountChange
        }
      },
      topExpenses,
      last3MonthsSalary,
      breakdown: {
        topCategories
      },
      insights: {
        recurringPayments
      }
    });
  } catch (error) {
    console.error('Error fetching transaction metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction metrics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
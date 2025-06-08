import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const accountType = searchParams.get('accountType');
    const bank = searchParams.get('bank');
    const timeRange = searchParams.get('timeRange') || '30days';

    // Calculate date ranges based on timeRange
    let daysBack = 30;
    switch (timeRange) {
      case '7days':
        daysBack = 7;
        break;
      case '30days':
        daysBack = 30;
        break;
      case '60days':
        daysBack = 60;
        break;
      default:
        daysBack = 30;
        break;
    }

    // Get date for current period
    const periodStartDate = new Date();
    periodStartDate.setDate(periodStartDate.getDate() - daysBack);
    
    // Get date for previous period (for comparison)
    const previousPeriodStartDate = new Date();
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - (daysBack * 2));

    // Build where clause for filtering
    const buildSupabaseQuery = (dateStart: Date, dateEnd?: Date) => {
      let query = supabase
        .from('transactions')
        .select('*');

      // Add date filter
      if (dateEnd) {
        query = query.gte('date', dateStart.toISOString()).lt('date', dateEnd.toISOString());
      } else {
        query = query.gte('date', dateStart.toISOString());
      }

      // Add account type filter
      if (accountType && accountType !== 'all') {
        query = query.eq('account_type', accountType); // 'Bank Account' or 'Credit Card'
      }

      return query;
    };

    // Fetch transactions for current period
    let recentQuery = buildSupabaseQuery(periodStartDate);
    const { data: allRecentTransactions, error: recentError } = await recentQuery;

    if (recentError) {
      console.error('Error fetching recent transactions:', recentError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Fetch transactions for previous period for comparison
    let previousQuery = buildSupabaseQuery(previousPeriodStartDate, periodStartDate);
    const { data: allPreviousTransactions, error: prevError } = await previousQuery;

    if (prevError) {
      console.error('Error fetching previous transactions:', prevError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Apply client-side filtering for complex search and bank filters
    const applyClientFilters = (transactions: any[]) => {
      return transactions.filter(transaction => {
        // Search filter
        if (search) {
          const searchMatch = transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
                            transaction.bank_name?.toLowerCase().includes(search.toLowerCase());
          if (!searchMatch) return false;
        }

        // Bank filter
        if (bank && bank !== 'all') {
          const bankMatch = transaction.bank_name?.toLowerCase().includes(bank.toLowerCase()) ||
                           transaction.source?.toLowerCase().includes(bank.toLowerCase());
          if (!bankMatch) return false;
        }

        return true;
      });
    };

    const recentTransactions = applyClientFilters(allRecentTransactions || []);
    const previousTransactions = applyClientFilters(allPreviousTransactions || []);

    // Calculate current period metrics
    const totalTransactions = recentTransactions.length;
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const dailyAvgSpending = totalExpenses / daysBack;
    const avgTransactionAmount = totalTransactions > 0 ? totalExpenses / recentTransactions.filter(t => t.type === 'expense').length : 0;

    // Calculate previous period metrics for comparison
    const prevTotalTransactions = previousTransactions.length;
    const prevTotalExpenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const prevDailyAvgSpending = prevTotalExpenses / daysBack;
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

    // Get last 3 months of Quizizz salary data (May, April, March 2025)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: allQuizizzTransactions, error: quizizzError } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'income')
      .ilike('description', '%quizizz%')
      .gte('date', threeMonthsAgo.toISOString())
      .order('date', { ascending: false });

    if (quizizzError) {
      console.error('Error fetching Quizizz transactions:', quizizzError);
    }

    // Group by month and sum up salaries
    interface TransactionData {
      id: string;
      date: Date;
      amount: number;
      description: string;
      type: string;
      category?: string | null;
    }
    
    const salaryByMonth = (allQuizizzTransactions || []).reduce((acc: Record<string, {total: number, transactions: TransactionData[]}>, t) => {
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
    const descriptionGroups = recentTransactions.reduce((acc: Record<string, TransactionData[]>, t) => {
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
      .map(([, transactions]) => ({
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
        start: periodStartDate,
        end: new Date(),
        days: daysBack
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
  }
} 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create server client to get user session
async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(request: Request) {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user session to filter data by user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('🔑 Transaction Metrics API: Fetching data for user:', user.id);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const accountType = searchParams.get('accountType');
    const bank = searchParams.get('bank');
    const timeRange = searchParams.get('timeRange') || '30days';
    const dataSource = searchParams.get('dataSource'); // Now an optional filter: 'statement' or 'email'

    // Calculate date ranges based on timeRange
    let daysBack = 30;
    if (timeRange === '7days') daysBack = 7;
    if (timeRange === '60days') daysBack = 60;

    const periodEndDate = new Date();
    const periodStartDate = new Date();
    periodStartDate.setDate(periodEndDate.getDate() - daysBack);
    
    const previousPeriodEndDate = new Date(periodStartDate);
    const previousPeriodStartDate = new Date(previousPeriodEndDate);
    previousPeriodStartDate.setDate(previousPeriodEndDate.getDate() - daysBack);

    // Build a reusable query function
    const buildSupabaseQuery = (startDate: Date, endDate: Date) => {
      let query = supabaseAdmin!
        .from('all_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lt('date', endDate.toISOString());

      if (dataSource) {
        query = query.eq('source', dataSource);
      }
      if (accountType && accountType !== 'all') {
        query = query.eq('account_type', accountType);
      }
      // Bank and search filters are applied later on the returned data
      return query;
    };

    // Fetch transactions for current and previous periods in parallel
    const [
      { data: allRecentTransactions, error: recentError },
      { data: allPreviousTransactions, error: prevError }
    ] = await Promise.all([
      buildSupabaseQuery(periodStartDate, periodEndDate),
      buildSupabaseQuery(previousPeriodStartDate, previousPeriodEndDate)
    ]);

    if (recentError || prevError) {
      console.error('Error fetching transactions:', recentError || prevError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Apply client-side filtering for search and bank (as it was before)
    const applyClientFilters = (transactions: any[]) => {
      if (!transactions) return [];
      return transactions.filter((transaction: any) => {
        const searchLower = search?.toLowerCase();
        const bankLower = bank?.toLowerCase();

        if (search && !(
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.bank_name?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }

        if (bank && bank !== 'all' && !transaction.bank_name?.toLowerCase().includes(bankLower)) {
          return false;
        }
        return true;
      });
    };

    const recentTransactions = applyClientFilters(allRecentTransactions);
    const previousTransactions = applyClientFilters(allPreviousTransactions);

    // Standardized expense type
    const expenseType = 'expense';
    
    // Helper to calculate metrics for a given set of transactions
    const calculateMetrics = (transactions: any[]) => {
      const filteredExpenses = transactions.filter(t => t.type === expenseType);
      const totalExpenses = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
      return {
        totalTransactions: transactions.length,
        totalExpenses,
        expenseTransactionsCount: filteredExpenses.length,
      };
    };
    
    const currentMetrics = calculateMetrics(recentTransactions);
    const previousMetrics = calculateMetrics(previousTransactions);

    const dailyAvgSpending = currentMetrics.totalExpenses / daysBack;
    const avgTransactionAmount = currentMetrics.expenseTransactionsCount > 0 ? currentMetrics.totalExpenses / currentMetrics.expenseTransactionsCount : 0;
    
    const prevDailyAvgSpending = previousMetrics.totalExpenses / daysBack;
    const prevAvgTransactionAmount = previousMetrics.expenseTransactionsCount > 0 ? previousMetrics.totalExpenses / previousMetrics.expenseTransactionsCount : 0;

    // Calculate percentage changes
    const expenseChange = previousMetrics.totalExpenses > 0 ? ((currentMetrics.totalExpenses - previousMetrics.totalExpenses) / previousMetrics.totalExpenses) * 100 : 0;
    const transactionCountChange = previousMetrics.totalTransactions > 0 ? ((currentMetrics.totalTransactions - previousMetrics.totalTransactions) / previousMetrics.totalTransactions) * 100 : 0;
    const dailySpendingChange = prevDailyAvgSpending > 0 ? ((dailyAvgSpending - prevDailyAvgSpending) / prevDailyAvgSpending) * 100 : 0;
    const avgTransactionChange = prevAvgTransactionAmount > 0 ? ((avgTransactionAmount - prevAvgTransactionAmount) / prevAvgTransactionAmount) * 100 : 0;
    
    // --- The rest of the insight calculations (top expenses, salary, etc.) remain largely the same, but will now operate on unified data ---

    // Find top 3 expenses in the current period
    const topExpenses = recentTransactions
      .filter(t => t.type === expenseType)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map(t => ({ merchant: t.description, amount: t.amount, date: t.date }));

    // Get last 3 months of salary data (from all_transactions)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: allQuizizzTransactions, error: quizizzError } = await supabase
      .from('all_transactions')
      .select('*')
      .eq('type', 'income')
      .ilike('description', '%quizizz%')
      .gte('date', threeMonthsAgo.toISOString())
      .order('date', { ascending: false });

    if (quizizzError) console.error('Error fetching Quizizz transactions:', quizizzError);

    // Group by month and sum up salaries
    const salaryByMonth = (allQuizizzTransactions || []).reduce((acc: Record<string, {total: number, date: string}>, t) => {
      const monthKey = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, date: t.date };
      }
      acc[monthKey].total += t.amount;
      return acc;
    }, {});

    const last3MonthsSalary = Object.entries(salaryByMonth)
      .map(([month, data]) => ({ month, amount: data.total, date: data.date }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    // Category breakdown (top 5)
    const categoryBreakdown = recentTransactions
      .filter(t => t.type === expenseType && t.category)
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
        percentage: currentMetrics.totalExpenses > 0 ? (amount / currentMetrics.totalExpenses) * 100 : 0
      }));

    // Detect recurring payments
    const descriptionGroups = recentTransactions.reduce((acc: Record<string, any[]>, t) => {
      const normalizedDesc = t.description.toLowerCase().replace(/\d+/g, '').replace(/[^\w\s]/g, '').trim();
      if (normalizedDesc.length > 3) {
        acc[normalizedDesc] = acc[normalizedDesc] || [];
        acc[normalizedDesc].push(t);
      }
      return acc;
    }, {});
    
    const recurringPayments = Object.entries(descriptionGroups)
      .filter(([, txs]) => txs.length >= 2)
      .map(([, txs]) => ({
        pattern: txs[0].description.split(' ').slice(0, 3).join(' '),
        count: txs.length,
        totalAmount: txs.reduce((sum, t) => sum + t.amount, 0),
        avgAmount: txs.reduce((sum, t) => sum + t.amount, 0) / txs.length,
        lastDate: new Date(Math.max(...txs.map(t => new Date(t.date).getTime()))),
        category: txs[0].category,
        type: txs[0].type
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      period: { start: periodStartDate, end: periodEndDate, days: daysBack },
      metrics: {
        totalExpenses: { current: currentMetrics.totalExpenses, previous: previousMetrics.totalExpenses, change: expenseChange },
        dailyAvgSpending: { current: dailyAvgSpending, previous: prevDailyAvgSpending, change: dailySpendingChange },
        avgTransaction: { current: avgTransactionAmount, previous: prevAvgTransactionAmount, change: avgTransactionChange },
        totalTransactions: { current: currentMetrics.totalTransactions, previous: previousMetrics.totalTransactions, change: transactionCountChange }
      },
      topExpenses,
      last3MonthsSalary,
      breakdown: { topCategories },
      insights: { recurringPayments }
    });

  } catch (error) {
    console.error('Error fetching transaction metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction metrics' },
      { status: 500 }
    );
  }
} 
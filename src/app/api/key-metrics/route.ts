import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to get the latest bank account balance
async function getLatestBankBalance() {
  // First, get the most recent month with bank account balance data
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('account_type', 'Bank Account')
    .order('statement_month', { ascending: false })
    .limit(12); // Get a full year of data for percentage calculations
  
  if (error) throw new Error('Failed to fetch bank balances');
  if (!data || data.length === 0) return null;

  // Group by statement_month to sum all banks for each month
  const monthlyBalances = new Map<string, { 
    total: number,
    lastTransactionDate: string | null,
    month: string
  }>();
  
  data.forEach(balance => {
    if (!balance.statement_month) return;
    
    if (!monthlyBalances.has(balance.statement_month)) {
      monthlyBalances.set(balance.statement_month, {
        total: 0,
        lastTransactionDate: null,
        month: balance.statement_month
      });
    }
    
    const entry = monthlyBalances.get(balance.statement_month)!;
    entry.total += (balance.closing_balance || 0);
    
    // Track the latest transaction date for this month
    if (balance.last_expense_date) {
      if (!entry.lastTransactionDate || new Date(balance.last_expense_date) > new Date(entry.lastTransactionDate)) {
        entry.lastTransactionDate = balance.last_expense_date;
      }
    }
  });
  
  // Convert to array and sort by month (most recent first)
  const sortedMonths = Array.from(monthlyBalances.values()).sort((a, b) => {
    // Parse month names to sort them correctly
    const parseMonth = (monthStr: string) => {
      const parts = monthStr.split(' ');
      const month = parts[0];
      const year = parseInt(parts[1]);
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(month);
      return new Date(year, monthIndex);
    };
    
    return parseMonth(b.month).getTime() - parseMonth(a.month).getTime();
  });
  
  return sortedMonths;
}

// Helper to get the latest credit card statement date
async function getLatestCreditCardInfo() {
  const { data, error } = await supabase
    .from('balances')
    .select('last_expense_date, statement_month')
    .eq('account_type', 'Credit Card')
    .order('statement_month', { ascending: false })
    .limit(2);
  
  if (error) throw new Error('Failed to fetch credit card data');
  if (!data || data.length === 0) return { currentMonth: null, previousMonth: null };
  
  return {
    currentMonth: data[0],
    previousMonth: data[1] || null
  };
}

// Helper to get expenses since a date
async function getExpensesSince(date: string, accountType: 'Bank Account' | 'Credit Card') {
  if (!date) return 0;
  
  const { data, error } = await supabase
    .from('all_transactions')
    .select('amount')
    .eq('account_type', accountType)
    .eq('type', 'expense')
    .gt('date', date);
  
  if (error) throw new Error(`Failed to fetch ${accountType} expenses`);
  return data?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
}

// Helper to get reward points - now sums all reward points from the most recent month
async function getRewardPoints() {
  // First get the most recent month
  const { data: latestMonth, error: monthError } = await supabase
    .from('balances')
    .select('statement_month')
    .order('statement_month', { ascending: false })
    .limit(1);
    
  if (monthError || !latestMonth || latestMonth.length === 0) {
    return { currentRewardPoints: 0, prevRewardPoints: 0 };
  }
  
  const currentMonth = latestMonth[0].statement_month;
  
  // Now get all reward points for that month and the previous month
  const { data: currentMonthData, error: currentError } = await supabase
    .from('balances')
    .select('reward_points')
    .eq('statement_month', currentMonth)
    .not('reward_points', 'is', null);
    
  if (currentError) {
    console.error('Error fetching reward points:', currentError);
    return { currentRewardPoints: 0, prevRewardPoints: 0 };
  }
  
  // Get previous month by parsing the current month
  const getPreviousMonth = (monthStr: string) => {
    const parts = monthStr.split(' ');
    const month = parts[0];
    const year = parseInt(parts[1]);
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(month);
    
    let prevMonthIndex = monthIndex - 1;
    let prevYear = year;
    
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear--;
    }
    
    return `${['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'][prevMonthIndex]} ${prevYear}`;
  };
  
  const previousMonth = getPreviousMonth(currentMonth);
  
  const { data: prevMonthData, error: prevError } = await supabase
    .from('balances')
    .select('reward_points')
    .eq('statement_month', previousMonth)
    .not('reward_points', 'is', null);
    
  if (prevError) {
    console.error('Error fetching previous reward points:', prevError);
    return { 
      currentRewardPoints: currentMonthData.reduce((sum, item) => sum + (item.reward_points || 0), 0),
      prevRewardPoints: 0 
    };
  }

  return {
    currentRewardPoints: currentMonthData.reduce((sum, item) => sum + (item.reward_points || 0), 0),
    prevRewardPoints: prevMonthData.reduce((sum, item) => sum + (item.reward_points || 0), 0)
  };
}

export async function GET(request: Request) {
  try {
    // --- Current Bank Balance ---
    const bankBalances = await getLatestBankBalance();
    if (!bankBalances || bankBalances.length < 2) {
      return NextResponse.json({ error: 'Insufficient bank balance data' }, { status: 400 });
    }
    
    const currentMonth = bankBalances[0];
    const prevMonth = bankBalances[1];
    
    // Calculate current bank balance
    const expensesSinceLastTransaction = await getExpensesSince(
      currentMonth.lastTransactionDate || '', 'Bank Account'
    );
    
    const currentBankBalance = currentMonth.total - expensesSinceLastTransaction;
    const prevBankBalance = prevMonth.total;
    
    // --- Credit Card Dues - Updated calculation ---
    const creditCardInfo = await getLatestCreditCardInfo();
    
    // Simply sum all credit card expenses since the last transaction date
    const currentCreditCardDues = creditCardInfo.currentMonth?.last_expense_date
      ? await getExpensesSince(creditCardInfo.currentMonth.last_expense_date, 'Credit Card')
      : 0;
      
    const prevCreditCardDues = creditCardInfo.previousMonth?.last_expense_date
      ? await getExpensesSince(creditCardInfo.previousMonth.last_expense_date, 'Credit Card')
      : 0;
    
    // --- Reward Points - Updated calculation ---
    const { currentRewardPoints, prevRewardPoints } = await getRewardPoints();

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const response = {
      currentBalance: {
        value: currentBankBalance,
        change: calculatePercentageChange(currentBankBalance, prevBankBalance),
        month: currentMonth.month
      },
      creditCardBill: {
        value: currentCreditCardDues,
        change: calculatePercentageChange(currentCreditCardDues, prevCreditCardDues),
        month: creditCardInfo.currentMonth?.statement_month || ''
      },
      rewardPoints: {
        value: currentRewardPoints,
        change: calculatePercentageChange(currentRewardPoints, prevRewardPoints)
      },
      debug: {
        currentMonthTotal: currentMonth.total,
        expensesSinceLastTransaction,
        currentBankBalance,
        prevBankBalance,
        currentCreditCardDues,
        prevCreditCardDues,
        currentRewardPoints,
        prevRewardPoints
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching key metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch key metrics' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
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

interface MonthData {
  month: string;
  year: number;
}

// Parse month string (e.g. "May") to get the month number
function getMonthNumber(monthName: string): number {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months.indexOf(monthName);
}

// Helper to parse statement_month (e.g. "May 2023" or just "May") into month and year
function parseStatementMonth(statementMonth: string | null): MonthData | null {
  if (!statementMonth) return null;
  
  const parts = statementMonth.split(' ');
  let month, year;
  
  if (parts.length === 2) {
    // Format: "May 2023"
    month = parts[0];
    year = parseInt(parts[1]);
  } else if (parts.length === 1) {
    // Format: "May" - assume current year
    month = parts[0];
    year = new Date().getFullYear();
  } else {
    return null;
  }
  
  if (isNaN(year)) return null;
  
  return {
    month,
    year
  };
}

// Helper to sort months chronologically (most recent first)
function sortMonthsDescending(a: { statement_month: string | null }, b: { statement_month: string | null }): number {
  const monthA = parseStatementMonth(a.statement_month);
  const monthB = parseStatementMonth(b.statement_month);
  
  if (!monthA || !monthB) return 0;
  
  if (monthA.year !== monthB.year) {
    return monthB.year - monthA.year; // Most recent year first
  }
  
  const monthIndexA = getMonthNumber(monthA.month);
  const monthIndexB = getMonthNumber(monthB.month);
  
  return monthIndexB - monthIndexA; // Most recent month first
}

// Get expenses since a specific transaction ID
async function getExpensesSinceTransactionId(lastTransactionId: string | null, accountType: string, userId: string): Promise<number> {
  if (!lastTransactionId || !supabaseAdmin) return 0;
  
  // First, get the date of the last transaction
  const { data: lastTransaction, error: lastTransactionError } = await supabaseAdmin
    .from('all_transactions')
    .select('date')
    .eq('id', lastTransactionId)
    .eq('user_id', userId)
    .single();
  
  if (lastTransactionError || !lastTransaction) {
    console.error('Error fetching last transaction:', lastTransactionError);
    return 0;
  }
  
  // Then, get all expenses since that date
  const { data: expenses, error: expensesError } = await supabaseAdmin
    .from('all_transactions')
    .select('amount')
    .eq('account_type', accountType)
    .eq('type', 'expense')
    .eq('user_id', userId)
    .gt('date', lastTransaction.date);
  
  if (expensesError) {
    console.error(`Error fetching expenses for ${accountType}:`, expensesError);
    return 0;
  }
  
  // Sum up all expenses
  return expenses?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
}

// Calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function GET(request: NextRequest) {
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

    console.log('🔑 API: Fetching metrics for user:', user.id);
    
    // No year filter needed
    
    // 1. Get the most recent month with balances data
    const { data: latestMonthData } = await supabaseAdmin
      .from('balances')
      .select('statement_month')
      .eq('user_id', user.id)
      .order('statement_month', { ascending: false })
      .limit(1);
    
    // --- 1. Current Bank Balance ---
    // Get the last two months of bank account balances
    const { data: bankBalances, error: bankBalancesError } = await supabaseAdmin
      .from('balances')
      .select('*')
      .eq('account_type', 'Bank Account')
      .eq('user_id', user.id)
      .order('statement_month', { ascending: false });
    
    if (bankBalancesError) {
      console.error('Error fetching bank balances:', bankBalancesError);
      return NextResponse.json({ error: 'Failed to fetch bank balances' }, { status: 500 });
    }
    
    // Sort by most recent month first
    bankBalances.sort(sortMonthsDescending);
    
    if (bankBalances.length < 1) {
      return NextResponse.json({ error: 'Insufficient bank balance data' }, { status: 400 });
    }
    
    // Group balances by month
    const balancesByMonth = new Map<string, { 
      total: number,
      bankTotals: Record<string, { balance: number, lastTransactionId: string | null }> 
    }>();
    
    bankBalances.forEach(balance => {
      if (!balance.statement_month) return;
      
      if (!balancesByMonth.has(balance.statement_month)) {
        balancesByMonth.set(balance.statement_month, {
          total: 0,
          bankTotals: {}
        });
      }
      
      const entry = balancesByMonth.get(balance.statement_month)!;
      entry.total += (balance.closing_balance || 0);
      
      // Track each bank's balance and last_transaction_id
      entry.bankTotals[balance.bank_name] = {
        balance: balance.closing_balance || 0,
        lastTransactionId: balance.last_transaction_id
      };
    });
    
    // Convert to array and ensure it's sorted
    const sortedMonths = Array.from(balancesByMonth.entries())
      .sort((a, b) => {
        const monthA = parseStatementMonth(a[0]);
        const monthB = parseStatementMonth(b[0]);
        
        if (!monthA || !monthB) return 0;
        
        if (monthA.year !== monthB.year) {
          return monthB.year - monthA.year;
        }
        
        return getMonthNumber(monthB.month) - getMonthNumber(monthA.month);
      });
    
    if (sortedMonths.length < 1) {
      return NextResponse.json({ error: 'Insufficient bank balance data after grouping' }, { status: 400 });
    }
    
    const currentMonth = sortedMonths[0];
    
    // Calculate current bank balance by subtracting recent expenses from each bank
    const bankExpensesPromises = Object.entries(currentMonth[1].bankTotals).map(async ([bankName, bankData]) => {
      const expenses = await getExpensesSinceTransactionId(bankData.lastTransactionId, 'Bank Account', user.id);
      return { bankName, expenses };
    });
    
    const bankExpenses = await Promise.all(bankExpensesPromises);
    
    const totalExpenses = bankExpenses.reduce((sum, { expenses }) => sum + expenses, 0);
    const currentBankBalance = currentMonth[1].total - totalExpenses;
    
    // --- 2. Current Month Expenses ---
    // This is already calculated as totalExpenses above
    const currentMonthExpenses = totalExpenses;
    
    // --- 3. Current Credit Card Dues ---
    // Get latest credit card data
    const { data: creditCardBalances, error: creditCardError } = await supabaseAdmin
      .from('balances')
      .select('*')
      .eq('account_type', 'Credit Card')
      .eq('user_id', user.id)
      .order('statement_month', { ascending: false });
    
    if (creditCardError) {
      console.error('Error fetching credit card data:', creditCardError);
      return NextResponse.json({ error: 'Failed to fetch credit card data' }, { status: 500 });
    }
    
    // Sort by most recent month first
    creditCardBalances.sort(sortMonthsDescending);
    
    // Group by month
    const creditCardsByMonth = new Map<string, { 
      total: number,
      cardTotals: Record<string, { due: number, lastTransactionId: string | null }> 
    }>();
    
    creditCardBalances.forEach(balance => {
      if (!balance.statement_month) return;
      
      if (!creditCardsByMonth.has(balance.statement_month)) {
        creditCardsByMonth.set(balance.statement_month, {
          total: 0,
          cardTotals: {}
        });
      }
      
      const entry = creditCardsByMonth.get(balance.statement_month)!;
      entry.total += (balance.credit_card_amount_due || 0);
      
      // Track each card's dues and last_transaction_id
      entry.cardTotals[balance.bank_name] = {
        due: balance.credit_card_amount_due || 0,
        lastTransactionId: balance.last_transaction_id
      };
    });
    
    // Convert to array and ensure it's sorted
    const sortedCreditCardMonths = Array.from(creditCardsByMonth.entries())
      .sort((a, b) => {
        const monthA = parseStatementMonth(a[0]);
        const monthB = parseStatementMonth(b[0]);
        
        if (!monthA || !monthB) return 0;
        
        if (monthA.year !== monthB.year) {
          return monthB.year - monthA.year;
        }
        
        return getMonthNumber(monthB.month) - getMonthNumber(monthA.month);
      });
    
    let currentCreditCardDues = 0;
    
    if (sortedCreditCardMonths.length > 0) {
      const currentCreditCardMonth = sortedCreditCardMonths[0];
      
      // Calculate credit card dues by adding recent expenses to last statement dues
      const cardExpensesPromises = Object.entries(currentCreditCardMonth[1].cardTotals).map(async ([cardName, cardData]) => {
        const expenses = await getExpensesSinceTransactionId(cardData.lastTransactionId, 'Credit Card', user.id);
        return { cardName, expenses };
      });
      
      const cardExpenses = await Promise.all(cardExpensesPromises);
      const totalCardExpenses = cardExpenses.reduce((sum, { expenses }) => sum + expenses, 0);
      
      currentCreditCardDues = currentCreditCardMonth[1].total + totalCardExpenses;
    }
    
    // --- 4. Reward Points (as of last month) ---
    const { data: rewardPointsData, error: rewardPointsError } = await supabaseAdmin
      .from('balances')
      .select('reward_points, statement_month')
      .eq('user_id', user.id)
      .not('reward_points', 'is', null)
      .order('statement_month', { ascending: false });
    
    if (rewardPointsError) {
      console.error('Error fetching reward points:', rewardPointsError);
      return NextResponse.json({ error: 'Failed to fetch reward points' }, { status: 500 });
    }
    
    // Group by month
    const rewardPointsByMonth = new Map<string, number>();
    
    rewardPointsData.forEach(balance => {
      if (!balance.statement_month || balance.reward_points === null) return;
      
      if (!rewardPointsByMonth.has(balance.statement_month)) {
        rewardPointsByMonth.set(balance.statement_month, 0);
      }
      
      rewardPointsByMonth.set(
        balance.statement_month, 
        rewardPointsByMonth.get(balance.statement_month)! + balance.reward_points
      );
    });
    
    // Convert to array and sort
    const sortedRewardPoints = Array.from(rewardPointsByMonth.entries())
      .sort((a, b) => {
        const monthA = parseStatementMonth(a[0]);
        const monthB = parseStatementMonth(b[0]);
        
        if (!monthA || !monthB) return 0;
        
        if (monthA.year !== monthB.year) {
          return monthB.year - monthA.year;
        }
        
        return getMonthNumber(monthB.month) - getMonthNumber(monthA.month);
      });
    
    let currentRewardPoints = 0;
    
    if (sortedRewardPoints.length > 0) {
      currentRewardPoints = sortedRewardPoints[0][1];
    }
    
    // Prepare response without comparisons
    const response = {
      currentBankBalance: {
        value: currentBankBalance,
        month: currentMonth[0]
      },
      currentMonthExpenses: {
        value: currentMonthExpenses,
        month: currentMonth[0]
      },
      creditCardDues: {
        value: currentCreditCardDues,
        month: sortedCreditCardMonths.length > 0 ? sortedCreditCardMonths[0][0] : null
      },
      rewardPoints: {
        value: currentRewardPoints,
        month: sortedRewardPoints.length > 0 ? sortedRewardPoints[0][0] : null
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in key-metrics-v2 API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
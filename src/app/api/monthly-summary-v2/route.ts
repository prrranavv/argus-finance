import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    console.log('🔑 Monthly Summary API: Fetching data for user:', user.id);

    const { searchParams } = new URL(request.url);
    const selectedBank = searchParams.get('bank') || 'Total';
    // No year filter needed
    
    // If bank is specified, get data for that bank only
    let query = supabaseAdmin
      .from('balances')
      .select('*')
      .eq('account_type', 'Bank Account')
      .eq('user_id', user.id)
      .order('statement_month', { ascending: false });
    
    // First, fetch all the balances data
    const { data: balances, error: balanceError } = await query;
    if (balanceError) {
      console.error('Error fetching balances:', balanceError);
      return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 });
    }

    // Group balances by month
    const monthlyData = new Map<string, {
      month: string;
      accountBalance: number;
      sortKey: number;
      bankBalances: Record<string, { balance: number; lastTransactionId: string | null }>;
    }>();

    // Organize balances by month
    balances?.forEach(balance => {
      if (!balance.statement_month) return;
      
      const monthName = balance.statement_month;
      
      if (!monthlyData.has(monthName)) {
        // Add a numeric sortKey to each month entry
        const parsed = parseStatementMonth(monthName);
        if (!parsed) return;
        
        const sortKey = parsed.year * 100 + getMonthNumber(parsed.month) + 1; // YYYYMM format
        
        monthlyData.set(monthName, {
          month: monthName,
          accountBalance: 0,
          sortKey: sortKey,
          bankBalances: {}
        });
      }
      
      const entry = monthlyData.get(monthName)!;
      
      // Store each bank's balance and last transaction ID
      entry.bankBalances[balance.bank_name] = {
        balance: balance.closing_balance || 0,
        lastTransactionId: balance.last_transaction_id
      };
      
      if (selectedBank === 'Total' || selectedBank === null) {
        // For Total view, sum up all bank balances
        entry.accountBalance += (balance.closing_balance || 0);
      } else if (balance.bank_name === selectedBank) {
        // For specific bank view, just use that bank's balance
        entry.accountBalance = balance.closing_balance || 0;
      }
    });

    // Convert to array and sort by month (most recent first)
    let result = Array.from(monthlyData.entries())
      .sort(([, a], [, b]) => b.sortKey - a.sortKey) // Descending order
      .map(([, data]) => {
        const { month, accountBalance, bankBalances } = data;
        return { month, accountBalance, bankBalances };
      });

    // If we have data, adjust the most recent month with recent expenses
    if (result.length > 0) {
      // Most recent month is already first due to descending sort
      const mostRecentData = result[0];
      let totalExpenses = 0;
      
      // Calculate recent expenses for each bank
      const expensesPromises = Object.entries(mostRecentData.bankBalances).map(async ([bankName, bankData]) => {
        const expenses = await getExpensesSinceTransactionId(bankData.lastTransactionId, 'Bank Account', user.id);
        return { bankName, expenses };
      });
      
      const recentExpenses = await Promise.all(expensesPromises);
      
      // Apply expenses based on bank filter
      if (selectedBank && selectedBank !== 'Total') {
        // For specific bank, only adjust that bank's balance
        const bankExpense = recentExpenses.find(item => item.bankName === selectedBank);
        if (bankExpense) {
          mostRecentData.accountBalance -= bankExpense.expenses;
        }
      } else {
        // For Total view, adjust with all bank expenses
        recentExpenses.forEach(({ expenses }) => {
          totalExpenses += expenses;
        });
        mostRecentData.accountBalance -= totalExpenses;
      }
    }

    // Format the final response
    const finalResult = result.map(item => {
      return {
        month: item.month,
        accountBalance: item.accountBalance
      };
    });

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Error in monthly summary API:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
async function getExpensesSinceTransactionId(lastTransactionId: string | null, accountType: string): Promise<number> {
  if (!lastTransactionId) return 0;
  
  // First, get the date of the last transaction
  const { data: lastTransaction, error: lastTransactionError } = await supabase
    .from('all_transactions')
    .select('date')
    .eq('id', lastTransactionId)
    .single();
  
  if (lastTransactionError || !lastTransaction) {
    console.error('Error fetching last transaction:', lastTransactionError);
    return 0;
  }
  
  // Then, get all expenses since that date
  const { data: expenses, error: expensesError } = await supabase
    .from('all_transactions')
    .select('amount')
    .eq('account_type', accountType)
    .eq('type', 'expense')
    .gt('date', lastTransaction.date);
  
  if (expensesError) {
    console.error(`Error fetching expenses for ${accountType}:`, expensesError);
    return 0;
  }
  
  // Sum up all expenses
  return expenses?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
}

export async function GET(request: NextRequest) {
  try {
    // Get unique bank names to include in the response
    const { data: bankData } = await supabase
      .from('balances')
      .select('bank_name')
      .eq('account_type', 'Bank Account')
      .order('bank_name');
    
    const uniqueBanks = [...new Set(bankData?.map(b => b.bank_name) || [])];
    
    // Fetch all bank account balances
    let balancesQuery = supabase
      .from('balances')
      .select('*')
      .eq('account_type', 'Bank Account')
      .order('statement_month');
    
    const { data: balances, error } = await balancesQuery;

    if (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json({ error: 'Failed to fetch balance progression' }, { status: 500 });
    }

    if (!balances || balances.length === 0) {
      return NextResponse.json([]);
    }

    // Group balances by month
    const monthlyData = new Map<string, {
      month: string;
      sortKey: number;
      Total: number;
      [key: string]: string | number;
    }>();
    
    balances.forEach(balance => {
      // Skip entries without statement_month
      if (!balance.statement_month) return;
      
      const month = balance.statement_month;
      
      if (!monthlyData.has(month)) {
        // Create a numeric sortKey for reliable chronological sorting
        const parsed = parseStatementMonth(month);
        if (!parsed) return;
        
        const sortKey = parsed.year * 100 + getMonthNumber(parsed.month) + 1; // YYYYMM format
        
        monthlyData.set(month, {
          month,
          week: month, // For backward compatibility with chart component
          sortKey,
          Total: 0,
          // Initialize all banks with 0
          ...Object.fromEntries(uniqueBanks.map(bank => [bank, 0]))
        });
      }
      
      const entry = monthlyData.get(month)!;
      
      // Set the balance for this specific bank
      if (balance.closing_balance !== null) {
        entry[balance.bank_name] = balance.closing_balance;
        entry.Total += balance.closing_balance;
      }
    });

    // Convert to array and sort by sortKey (ascending order - oldest first)
    let result = Array.from(monthlyData.values())
      .sort((a, b) => a.sortKey - b.sortKey);
    
    // If we have data, adjust the most recent month with recent expenses
    if (result.length > 0) {
      // Get the most recent month
      const mostRecentMonth = result[result.length - 1].month;
      
      // Get all balances for the most recent month
      const recentBalances = balances.filter(b => b.statement_month === mostRecentMonth);
      
      // Calculate recent expenses for each bank
      const expensesPromises = recentBalances.map(async balance => {
        const expenses = await getExpensesSinceTransactionId(balance.last_transaction_id, 'Bank Account');
        return {
          bankName: balance.bank_name,
          expenses
        };
      });
      
      const recentExpenses = await Promise.all(expensesPromises);
      
      // Adjust the most recent month's balances
      const mostRecentData = result[result.length - 1];
      let totalExpenses = 0;
      
      recentExpenses.forEach(({ bankName, expenses }) => {
        if (typeof mostRecentData[bankName] === 'number') {
          mostRecentData[bankName] = Number(mostRecentData[bankName]) - expenses;
          totalExpenses += expenses;
        }
      });
      
      // Adjust the total
      mostRecentData.Total -= totalExpenses;
    }
    
    // Remove sortKey from final output
    const finalResult = result.map(entry => {
      const { sortKey, ...rest } = entry;
      return rest;
    });

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Error fetching balance progression:', error);
    return NextResponse.json({ error: 'Failed to fetch balance progression' }, { status: 500 });
  }
} 
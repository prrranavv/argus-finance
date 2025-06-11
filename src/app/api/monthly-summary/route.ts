import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankFilter = searchParams.get('bank'); // 'Total', 'HDFC', 'Axis', etc.

    // First, fetch all the balances data
    let balanceQuery = supabase
      .from('balances')
      .select('statement_month, bank_name, closing_balance, account_type')
      .eq('account_type', 'Bank Account');
    
    if (bankFilter && bankFilter !== 'Total') {
      balanceQuery = balanceQuery.eq('bank_name', bankFilter);
    }
    
    const { data: balances, error: balanceError } = await balanceQuery;
    if (balanceError) throw new Error('Failed to fetch balances');

    const monthlyData = new Map<string, {
      month: string;
      accountBalance: number;
      credited: number;
      debited: number;
      sortKey: number;
    }>();

    // Organize balances by month
    balances?.forEach(balance => {
      if (!balance.statement_month) return;
      
      // Format the month string for display
      // Extract year and month from statement_month
      const monthName = balance.statement_month;
      
      if (!monthlyData.has(monthName)) {
        // Add a numeric sortKey to each month entry
        const parts = monthName.split(' ');
        const month = parts[0];
        const year = parseInt(parts[1]);
        const monthIndex = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].indexOf(month) + 1; // 1-12 instead of 0-11
        
        const sortKey = year * 100 + monthIndex; // YYYYMM format
        
        monthlyData.set(monthName, {
          month: monthName,
          accountBalance: 0,
          credited: 0,
          debited: 0,
          sortKey: sortKey
        });
      }
      
      const entry = monthlyData.get(monthName)!;
      
      if (bankFilter === 'Total' || bankFilter === null) {
        // For Total view, sum up all bank balances
        entry.accountBalance += (balance.closing_balance || 0);
      } else if (balance.bank_name === bankFilter) {
        // For specific bank view, just use that bank's balance
        entry.accountBalance = balance.closing_balance || 0;
      }
    });

    // Now get transaction data for credits and debits
    let transactionQuery = supabase
      .from('all_transactions')
      .select('date, amount, type, account_type, bank_name');

    if (bankFilter && bankFilter !== 'Total') {
      transactionQuery = transactionQuery.eq('bank_name', bankFilter);
    }
    
    const { data: transactions, error: transactionError } = await transactionQuery;
    if (transactionError) throw new Error('Failed to fetch transactions');

    // Add transaction data to the monthly summary
    transactions?.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthlyData.has(monthYear)) {
        // Skip if no balance data for this month
        return;
      }

      const entry = monthlyData.get(monthYear)!;

      if (transaction.type === 'income') {
        entry.credited += transaction.amount;
      } else if (transaction.type === 'expense' && transaction.account_type === 'Bank Account') {
        entry.debited += transaction.amount;
      }
    });

    // Sort results by month (most recent first)
    const result = Array.from(monthlyData.entries())
      .sort(([, a], [, b]) => b.sortKey - a.sortKey) // Use numeric sortKey for descending order
      .map(([, data]) => {
        // Remove sortKey from final response
        const { sortKey, ...rest } = data;
        return rest;
      });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in monthly summary API:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly summary' }, { status: 500 });
  }
} 
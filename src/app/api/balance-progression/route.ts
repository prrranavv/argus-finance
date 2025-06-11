import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get unique bank names to include in the response
    const { data: bankData } = await supabase
      .from('balances')
      .select('bank_name')
      .eq('account_type', 'Bank Account')
      .order('bank_name');
    
    const uniqueBanks = [...new Set(bankData?.map(b => b.bank_name) || [])];
    
    // Fetch all bank account balances
    const { data: balances, error } = await supabase
      .from('balances')
      .select('*')
      .eq('account_type', 'Bank Account')
      .order('statement_month');

    if (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json({ error: 'Failed to fetch balance progression' }, { status: 500 });
    }

    if (!balances || balances.length === 0) {
      return NextResponse.json([]);
    }

    // Group balances by month
    const monthlyData = new Map<string, any>();
    
    balances.forEach(balance => {
      // Skip entries without statement_month
      if (!balance.statement_month) return;
      
      const month = balance.statement_month;
      
      if (!monthlyData.has(month)) {
        // Create a numeric sortKey for reliable chronological sorting
        const parts = month.split(' ');
        const monthName = parts[0];
        const year = parseInt(parts[1]);
        const monthIndex = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].indexOf(monthName) + 1; // 1-12 instead of 0-11
        
        const sortKey = year * 100 + monthIndex; // YYYYMM format
        
        monthlyData.set(month, {
          month,
          week: month, // Use statement_month directly for display
          Total: 0,
          sortKey,
          // Initialize all banks with null
          ...Object.fromEntries(uniqueBanks.map(bank => [bank, null]))
        });
      }
      
      const entry = monthlyData.get(month);
      
      // Set the balance for this specific bank
      entry[balance.bank_name] = balance.closing_balance;
      
      // Add to the total (only counting non-null values)
      if (balance.closing_balance !== null) {
        entry.Total += balance.closing_balance;
      }
    });

    // Convert to array and sort by sortKey (ascending order - oldest first)
    const result = Array.from(monthlyData.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(entry => {
        // Remove sortKey from final output
        const { sortKey, ...rest } = entry;
        return rest;
      });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching balance progression:', error);
    return NextResponse.json({ error: 'Failed to fetch balance progression' }, { status: 500 });
  }
} 
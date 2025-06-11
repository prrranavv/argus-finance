import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get unique credit card names to include in the response
    const { data: cardData } = await supabase
      .from('all_transactions')
      .select('bank_name')
      .eq('account_type', 'Credit Card')
      .order('bank_name');
    
    const uniqueCards = [...new Set(cardData?.map(c => c.bank_name) || [])];
    
    // Check if there are any credit card entries in the balances table
    const { data: creditCardBalances, error: balancesError } = await supabase
      .from('balances')
      .select('*')
      .eq('account_type', 'Credit Card');
    
    // If we have balances data for credit cards, use it
    if (!balancesError && creditCardBalances && creditCardBalances.length > 0) {
      console.log("Using balances table for credit card data");
      
      // Group balances by month
      const monthlyData = new Map<string, any>();
      
      creditCardBalances.forEach(balance => {
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
            week: month, // Use statement_month for display in chart
            Total: 0,
            sortKey,
            // Initialize all cards with null
            ...Object.fromEntries(uniqueCards.map(card => [card, null]))
          });
        }
        
        const entry = monthlyData.get(month);
        
        // Set the balance for this specific card
        entry[balance.bank_name] = balance.closing_balance;
        
        // Add to the total (only counting non-null values)
        if (balance.closing_balance !== null) {
          entry.Total += balance.closing_balance;
        }
      });

      // Convert to array and sort by sortKey (ascending order - oldest first for chart)
      const result = Array.from(monthlyData.values())
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(entry => {
          // Remove sortKey from final output
          const { sortKey, ...rest } = entry;
          return rest;
        });

      return NextResponse.json(result);
    } 
    
    // Otherwise, generate data from all_transactions
    console.log("Generating credit card data from all_transactions");
    
    // Group by month and card to get monthly spending data
    const { data: monthlySpending, error: spendingError } = await supabase
      .from('all_transactions')
      .select('date, bank_name, amount, type')
      .eq('account_type', 'Credit Card')
      .eq('type', 'expense')
      .order('date', { ascending: true });
    
    if (spendingError) {
      console.error('Error fetching credit card transactions:', spendingError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
    
    if (!monthlySpending || monthlySpending.length === 0) {
      return NextResponse.json([]);
    }
    
    // Group by month and card
    const spending: Record<string, Record<string, number>> = {};
    const months = new Set<string>();
    
    monthlySpending.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const cardName = transaction.bank_name;
      
      // Initialize month and card if needed
      if (!spending[monthKey]) {
        spending[monthKey] = {};
        uniqueCards.forEach(card => {
          spending[monthKey][card] = 0;
        });
      }
      
      // Add to month total
      spending[monthKey][cardName] = (spending[monthKey][cardName] || 0) + transaction.amount;
      months.add(monthKey);
    });
    
    // Format data for chart
    const result = Array.from(months).map(month => {
      const data: Record<string, any> = { week: month };
      let total = 0;
      
      uniqueCards.forEach(card => {
        const amount = spending[month]?.[card] || 0;
        data[card] = amount;
        total += amount;
      });
      
      data.Total = total;
      return data;
    });
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching credit card progression:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit card progression' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function getMonthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedCard = searchParams.get('card') || 'Total';

    // Fetch credit card transactions from all_transactions table
    let query = supabase
      .from('all_transactions')
      .select('*')
      .eq('account_type', 'Credit Card')
      .order('date', { ascending: true });

    // Filter by specific card if not Total
    if (selectedCard !== 'Total') {
      query = query.eq('bank_name', selectedCard);
    }

    const { data: creditCardTransactions, error } = await query;

    if (error) {
      console.error('Error fetching credit card transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    if (!creditCardTransactions || creditCardTransactions.length === 0) {
      return NextResponse.json([]);
    }

    // Group transactions by month and calculate spending
    const monthlySpending: { [month: string]: number } = {};

    creditCardTransactions.forEach(transaction => {
      const monthKey = getMonthKey(new Date(transaction.date));
      
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = 0;
      }
      
      // Add expense amounts (positive numbers represent money spent)
      if (transaction.type === 'expense') {
        monthlySpending[monthKey] += transaction.amount;
      }
    });

    // Convert to array format and sort by date (descending - most recent first)
    const sortedData = Object.entries(monthlySpending)
      .map(([month, amount]) => ({
        month,
        amount: Math.round(amount)
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('Error fetching credit card summary:', error);
    return NextResponse.json({ error: 'Failed to fetch credit card summary' }, { status: 500 });
  }
} 
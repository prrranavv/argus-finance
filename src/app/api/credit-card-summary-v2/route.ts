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
async function getExpensesSinceTransactionId(lastTransactionId: string | null, cardName: string): Promise<number> {
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
  
  // Then, get all expenses since that date for the specific credit card
  let query = supabase
    .from('all_transactions')
    .select('amount')
    .eq('account_type', 'Credit Card')
    .eq('type', 'expense')
    .gt('date', lastTransaction.date);
  
  // Filter by card name if not 'Total'
  if (cardName !== 'Total') {
    query = query.eq('bank_name', cardName);
  }
  
  const { data: expenses, error: expensesError } = await query;
  
  if (expensesError) {
    console.error(`Error fetching expenses for ${cardName}:`, expensesError);
    return 0;
  }
  
  // Sum up all expenses
  return expenses?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedCard = searchParams.get('card') || 'Total';
    
    // Fetch all credit card balances
    let query = supabase
      .from('balances')
      .select('*')
      .eq('account_type', 'Credit Card')
      .order('statement_month', { ascending: false });
    
    // If specific card is selected, filter for just that card
    if (selectedCard !== 'Total') {
      query = query.eq('bank_name', selectedCard);
    }
    
    const { data: balances, error: balanceError } = await query;
    
    if (balanceError) {
      console.error('Error fetching credit card balances:', balanceError);
      return NextResponse.json({ error: 'Failed to fetch credit card summary' }, { status: 500 });
    }

    // Group balances by month
    const monthlyData = new Map<string, {
      month: string;
      accountBalance: number;
      sortKey: number;
      cardBalances: Record<string, { balance: number; lastTransactionId: string | null }>;
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
          cardBalances: {}
        });
      }
      
      const entry = monthlyData.get(monthName)!;
      
      // Store each card's balance and last transaction ID
      entry.cardBalances[balance.bank_name] = {
        balance: balance.credit_card_amount_due || 0,
        lastTransactionId: balance.last_transaction_id
      };
      
      if (selectedCard === 'Total') {
        // For Total view, sum up all card balances
        entry.accountBalance += (balance.credit_card_amount_due || 0);
      } else if (balance.bank_name === selectedCard) {
        // For specific card view, just use that card's balance
        entry.accountBalance = balance.credit_card_amount_due || 0;
      }
    });

    // Convert to array and sort by month (most recent first)
    let result = Array.from(monthlyData.entries())
      .sort(([, a], [, b]) => b.sortKey - a.sortKey) // Descending order
      .map(([, data]) => {
        const { month, accountBalance, cardBalances } = data;
        return { month, accountBalance, cardBalances };
      });

    // If we have data, adjust the most recent month with recent expenses
    if (result.length > 0) {
      // Most recent month is already first due to descending sort
      const mostRecentData = result[0];
      let totalExpenses = 0;
      
      // Calculate recent expenses for each credit card
      const expensesPromises = Object.entries(mostRecentData.cardBalances).map(async ([cardName, cardData]) => {
        const expenses = await getExpensesSinceTransactionId(cardData.lastTransactionId, cardName);
        return { cardName, expenses };
      });
      
      const recentExpenses = await Promise.all(expensesPromises);
      
      // Apply expenses based on card filter
      if (selectedCard !== 'Total') {
        // For specific card, only adjust that card's balance
        const cardExpense = recentExpenses.find(item => item.cardName === selectedCard);
        if (cardExpense) {
          mostRecentData.accountBalance += cardExpense.expenses; // For credit cards, expenses increase the balance
        }
      } else {
        // For Total view, adjust with all card expenses
        recentExpenses.forEach(({ expenses }) => {
          totalExpenses += expenses;
        });
        mostRecentData.accountBalance += totalExpenses; // For credit cards, expenses increase the balance
      }
    }

    // Format the final response
    const finalResult = result.map(item => {
      return {
        month: item.month,
        accountBalance: item.accountBalance
      };
    });

    console.log('Credit card summary for', selectedCard, ':', finalResult);
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Error in credit card summary API:', error);
    return NextResponse.json({ error: 'Failed to fetch credit card summary' }, { status: 500 });
  }
} 
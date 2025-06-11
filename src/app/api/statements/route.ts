import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // First get all statements
    const { data: statements, error: statementsError } = await supabase
      .from('statements')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (statementsError) {
      console.error('Error fetching statements:', statementsError);
      return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 });
    }

    // Then get transactions for each statement from all_transactions table
    const statementsWithTransactions = await Promise.all(
      (statements || []).map(async (statement) => {
        const { data: transactions, error: transError } = await supabase
          .from('all_transactions')
          .select('*')
          .eq('statement_id', statement.id)
          .eq('source', 'statement');

        if (transError) {
          console.error('Error fetching transactions for statement:', transError);
          return { ...statement, transactions: [] };
        }

        return { ...statement, transactions: transactions || [] };
      })
    );

    return NextResponse.json(statementsWithTransactions);
  } catch (error) {
    console.error('Error fetching statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
} 
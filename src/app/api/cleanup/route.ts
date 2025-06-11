import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'duplicates' or 'all'

    if (action === 'all') {
      // Get counts before deletion
      const { data: transactions } = await supabase.from('all_transactions').select('id');
      const { data: statements } = await supabase.from('statements').select('id');
      const { data: balances } = await supabase.from('balances').select('id');
      
      const transactionCount = transactions?.length || 0;
      const statementCount = statements?.length || 0;
      const balanceCount = balances?.length || 0;

      // Delete all balances first (may depend on other tables)
      const { error: balancesError } = await supabase
        .from('balances')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (balancesError) {
        console.error('Error deleting balances:', balancesError);
        return NextResponse.json({ error: 'Failed to delete balances' }, { status: 500 });
      }
      
      // Delete all transactions
      const { error: transError } = await supabase
        .from('all_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (transError) {
        console.error('Error deleting transactions:', transError);
        return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
      }

      // Delete all statements
      const { error: statementsError } = await supabase
        .from('statements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (statementsError) {
        console.error('Error deleting statements:', statementsError);
        return NextResponse.json({ error: 'Failed to delete statements' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Deleted all data: ${transactionCount} transactions, ${balanceCount} balances, and ${statementCount} statements`,
        transactionsDeleted: transactionCount,
        balancesDeleted: balanceCount,
        statementsDeleted: statementCount
      });
    } else {
      // Just clear duplicates (existing functionality)
      const { data: transactions, error } = await supabase
        .from('all_transactions')
        .select('*')
        .order('date', { ascending: true })
        .order('description', { ascending: true })
        .order('amount', { ascending: true })
        .order('type', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
      }

      const duplicates = [];
      const seen = new Set();

      for (const transaction of transactions || []) {
        // Include source in the key to prevent detecting cross-source "duplicates"
        const key = `${transaction.source}-${new Date(transaction.date).toISOString()}-${transaction.description}-${transaction.amount}-${transaction.type}`;
        
        if (seen.has(key)) {
          duplicates.push(transaction.id);
        } else {
          seen.add(key);
        }
      }

      if (duplicates.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No duplicates found',
          duplicatesRemoved: 0
        });
      }

      // Delete duplicate transactions (keeping the first occurrence of each)
      const { error: deleteError } = await supabase
        .from('all_transactions')
        .delete()
        .in('id', duplicates);

      if (deleteError) {
        console.error('Error deleting duplicates:', deleteError);
        return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Removed ${duplicates.length} duplicate transactions`,
        duplicatesRemoved: duplicates.length
      });
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup operation' },
      { status: 500 }
    );
  }
} 
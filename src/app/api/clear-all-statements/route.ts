import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
  try {
    // Order of deletion matters due to foreign key constraints.
    // 1. Delete all balances
    const { error: balancesError } = await supabase.from('balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (balancesError) {
      console.error('Error deleting balances:', balancesError);
      return NextResponse.json({ error: 'Failed to clear balances' }, { status: 500 });
    }
    
    // 2. Delete all transactions from the unified table
    const { error: allTransError } = await supabase.from('all_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (allTransError) {
      console.error('Error deleting all_transactions:', allTransError);
      return NextResponse.json({ error: 'Failed to clear all_transactions' }, { status: 500 });
    }
    
    // 3. Then delete all statements
    const { error: statementsError } = await supabase.from('statements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (statementsError) {
      console.error('Error deleting statements:', statementsError);
      return NextResponse.json({ error: 'Failed to clear statements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All statements, transactions, and balances cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
    return NextResponse.json(
      { error: 'Failed to clear all data' },
      { status: 500 }
    );
  }
} 
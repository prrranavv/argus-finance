import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
  try {
    // Delete all transactions first (due to foreign key constraints)
    const { error: transError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (transError) {
      console.error('Error deleting transactions:', transError);
      return NextResponse.json({ error: 'Failed to clear transactions' }, { status: 500 });
    }
    
    // Then delete all statements
    const { error: statementsError } = await supabase
      .from('statements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (statementsError) {
      console.error('Error deleting statements:', statementsError);
      return NextResponse.json({ error: 'Failed to clear statements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All statements and transactions cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing all statements:', error);
    return NextResponse.json(
      { error: 'Failed to clear statements' },
      { status: 500 }
    );
  }
} 
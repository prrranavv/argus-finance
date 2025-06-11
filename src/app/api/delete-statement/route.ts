import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // First, get the statement to return info about what's being deleted
    const { data: statement, error: statementError } = await supabase
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .single();

    if (statementError || !statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Get transaction count before deleting
    const { data: transactions } = await supabase
      .from('all_transactions')
      .select('id')
      .eq('statement_id', statementId)
      .eq('source', 'statement');

    const transactionCount = transactions?.length || 0;

    // Delete all associated transactions from all_transactions
    const { error: deleteTransError } = await supabase
      .from('all_transactions')
      .delete()
      .eq('statement_id', statementId)
      .eq('source', 'statement');

    if (deleteTransError) {
      console.error('Error deleting transactions:', deleteTransError);
      return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
    }

    // Delete associated balances if any
    const { error: deleteBalancesError } = await supabase
      .from('balances')
      .delete()
      .eq('statement_id', statementId);

    if (deleteBalancesError) {
      console.error('Error deleting balances:', deleteBalancesError);
      return NextResponse.json({ error: 'Failed to delete balances' }, { status: 500 });
    }

    // Then delete the statement
    const { error: deleteStatementError } = await supabase
      .from('statements')
      .delete()
      .eq('id', statementId);

    if (deleteStatementError) {
      console.error('Error deleting statement:', deleteStatementError);
      return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted statement "${statement.file_name}" and ${transactionCount} associated transactions`,
      data: {
        statementName: statement.file_name,
        transactionsDeleted: transactionCount
      }
    });

  } catch (error) {
    console.error('Error deleting statement:', error);
    return NextResponse.json(
      { error: 'Failed to delete statement' },
      { status: 500 }
    );
  }
} 
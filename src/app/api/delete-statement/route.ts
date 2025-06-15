import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create server client to get user session
async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user session to filter data by user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('🔑 Delete Statement API: Deleting for user:', user.id);

    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // First, get the statement to return info about what's being deleted (ensure user owns it)
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .eq('user_id', user.id)
      .single();

    if (statementError || !statement) {
      return NextResponse.json(
        { error: 'Statement not found or access denied' },
        { status: 404 }
      );
    }

    // Get transaction count before deleting (ensure user owns them)
    const { data: transactions } = await supabaseAdmin
      .from('all_transactions')
      .select('id')
      .eq('statement_id', statementId)
      .eq('source', 'statement')
      .eq('user_id', user.id);

    const transactionCount = transactions?.length || 0;

    // Delete all associated transactions from all_transactions
    const { error: deleteTransError } = await supabaseAdmin
      .from('all_transactions')
      .delete()
      .eq('statement_id', statementId)
      .eq('source', 'statement')
      .eq('user_id', user.id);

    if (deleteTransError) {
      console.error('Error deleting transactions:', deleteTransError);
      return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
    }

    // Delete associated balances if any
    const { error: deleteBalancesError } = await supabaseAdmin
      .from('balances')
      .delete()
      .eq('statement_id', statementId)
      .eq('user_id', user.id);

    if (deleteBalancesError) {
      console.error('Error deleting balances:', deleteBalancesError);
      return NextResponse.json({ error: 'Failed to delete balances' }, { status: 500 });
    }

    // Then delete the statement
    const { error: deleteStatementError } = await supabaseAdmin
      .from('statements')
      .delete()
      .eq('id', statementId)
      .eq('user_id', user.id);

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
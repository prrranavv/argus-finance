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

export async function POST(request: NextRequest) {
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

    console.log('🔑 Cleanup API: Processing for user:', user.id);

    const body = await request.json();
    const { action } = body; // 'duplicates' or 'all'

    if (action === 'all') {
      // Get counts before deletion for this user only
      const { data: transactions } = await supabaseAdmin.from('all_transactions').select('id').eq('user_id', user.id);
      const { data: statements } = await supabaseAdmin.from('statements').select('id').eq('user_id', user.id);
      const { data: balances } = await supabaseAdmin.from('balances').select('id').eq('user_id', user.id);
      
      const transactionCount = transactions?.length || 0;
      const statementCount = statements?.length || 0;
      const balanceCount = balances?.length || 0;

      // Delete all balances first (may depend on other tables) for this user
      const { error: balancesError } = await supabaseAdmin
        .from('balances')
        .delete()
        .eq('user_id', user.id);

      if (balancesError) {
        console.error('Error deleting balances:', balancesError);
        return NextResponse.json({ error: 'Failed to delete balances' }, { status: 500 });
      }
      
      // Delete all transactions for this user
      const { error: transError } = await supabaseAdmin
        .from('all_transactions')
        .delete()
        .eq('user_id', user.id);

      if (transError) {
        console.error('Error deleting transactions:', transError);
        return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
      }

      // Delete all statements for this user
      const { error: statementsError } = await supabaseAdmin
        .from('statements')
        .delete()
        .eq('user_id', user.id);

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
      // Just clear duplicates (existing functionality) for this user
      const { data: transactions, error } = await supabaseAdmin
        .from('all_transactions')
        .select('*')
        .eq('user_id', user.id)
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

      // Delete duplicate transactions (keeping the first occurrence of each) for this user
      const { error: deleteError } = await supabaseAdmin
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
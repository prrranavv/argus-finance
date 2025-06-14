import { NextResponse } from 'next/server';
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

export async function GET() {
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

    console.log('🔑 Statements API: Fetching data for user:', user.id);

    // First get all statements for this user
    const { data: statements, error: statementsError } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (statementsError) {
      console.error('Error fetching statements:', statementsError);
      return NextResponse.json({ error: 'Failed to fetch statements' }, { status: 500 });
    }

    // Then get transactions for each statement from all_transactions table
    const statementsWithTransactions = await Promise.all(
      (statements || []).map(async (statement) => {
        const { data: transactions, error: transError } = await supabaseAdmin!
          .from('all_transactions')
          .select('*')
          .eq('statement_id', statement.id)
          .eq('source', 'statement')
          .eq('user_id', user.id);

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
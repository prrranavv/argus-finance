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

    console.log('🔑 Banks-with-Types API: Fetching data for user:', user.id);

    // Get all unique bank names and account types from balances table for this user
    const { data: balances, error } = await supabaseAdmin
      .from('balances')
      .select('bank_name, account_type')
      .eq('user_id', user.id)
      .order('bank_name');

    if (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json({ error: 'Failed to fetch banks with types' }, { status: 500 });
    }

    // Group banks by account type
    const banksByType = balances.reduce((acc, balance) => {
      if (!balance.bank_name || !balance.account_type) return acc;
      
      if (!acc[balance.account_type]) {
        acc[balance.account_type] = new Set();
      }
      acc[balance.account_type].add(balance.bank_name);
      
      return acc;
    }, {} as Record<string, Set<string>>);

    // Convert sets to arrays and sort
    const result = Object.entries(banksByType).reduce((acc, [accountType, bankSet]) => {
      acc[accountType] = Array.from(bankSet).sort();
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in banks-with-types API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
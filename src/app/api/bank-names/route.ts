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

    console.log('🔑 Bank Names API: Fetching data for user:', user.id);

    // This is more efficient than fetching all transactions.
    // We create a function in Supabase to get distinct bank names.
    // The user should run this SQL in their Supabase SQL editor:
    /*
      create or replace function get_distinct_bank_names(user_uuid uuid)
      returns table (bank_name text) as $$
      begin
        return query
        select distinct t.bank_name 
        from all_transactions as t 
        where t.bank_name is not null and t.bank_name <> '' and t.user_id = user_uuid
        order by t.bank_name;
      end;
      $$ language plpgsql;
    */
    
    const { data, error } = await supabaseAdmin.rpc('get_distinct_bank_names', { user_uuid: user.id });

    if (error) {
      console.error("Error calling RPC get_distinct_bank_names. Falling back to fetching all.", error);
      // Fallback method if RPC is not created: fetch all and get unique names.
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('all_transactions')
        .select('bank_name')
        .eq('user_id', user.id);
        
      if (fallbackError) {
        throw fallbackError;
      }
      
      const bankNames = Array.from(new Set(fallbackData.map(t => t.bank_name).filter(Boolean))).sort();
      return NextResponse.json(bankNames);
    }
    
    // The RPC returns an array of objects like [{ bank_name: '...' }], so we map it.
    const bankNames = data.map((item: { bank_name: string }) => item.bank_name);
    return NextResponse.json(bankNames);

  } catch (error) {
    console.error('Error fetching bank names:', error);
    return NextResponse.json({ error: 'Failed to fetch bank names' }, { status: 500 });
  }
} 
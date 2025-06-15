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

    // Get user session
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { bank_name, account_number, account_type, is_primary } = body;

    if (!bank_name || !account_type) {
      return NextResponse.json({ error: 'Bank name and account type are required' }, { status: 400 });
    }

    if (!['bank_account', 'credit_card'].includes(account_type)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    console.log('🔑 Add Account API: Adding account for user:', user.id);

    // If this is marked as primary, unset other primary accounts of the same type
    if (is_primary) {
      await supabaseAdmin
        .from('user_accounts')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('account_type', account_type);
    }

    // Insert the new account
    const { data: account, error } = await supabaseAdmin
      .from('user_accounts')
      .insert({
        user_id: user.id,
        bank_name,
        account_number,
        account_type,
        is_primary: is_primary || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding account:', error);
      return NextResponse.json({ error: 'Failed to add account' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account
    });

  } catch (error) {
    console.error('Error in add account API:', error);
    return NextResponse.json(
      { error: 'Failed to add account' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user session
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('🔑 Get Accounts API: Fetching accounts for user:', user.id);

    // Fetch user accounts
    const { data: accounts, error } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || []
    });

  } catch (error) {
    console.error('Error in get accounts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
} 
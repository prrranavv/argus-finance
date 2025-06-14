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

export async function GET(request: NextRequest) {
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

    console.log('🔑 All Transactions API: Fetching data for user:', user.id);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const accountType = searchParams.get('accountType');
    const bank = searchParams.get('bank');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    console.log(`📊 Fetching transactions for user ${user.id}, page ${page}, limit ${limit}`);
    
    // Build query
    let query = supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters if provided
    if (source) {
      query = query.eq('source', source);
    }
    
    if (bank) {
      query = query.eq('bank_name', bank);
    }
    
    if (accountType) {
      query = query.eq('account_type', accountType);
    }
    
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    // Execute the query
    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
    
    // Transform dates for consistent frontend handling
    const transformedTransactions = transactions.map(tx => ({
      ...tx,
      date: new Date(tx.date).toISOString(),
      created_at: new Date(tx.created_at).toISOString(),
      updated_at: new Date(tx.updated_at).toISOString()
    }));
    
    console.log(`✅ Fetched ${transformedTransactions.length} transactions`);
    
    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error('Error in all-transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    console.log('🔑 Creating transaction for user:', user.id);
    
    console.log('💾 Creating new manual transaction...');
    
    // Parse the request body
    const body = await request.json();
    console.log('📄 Request body:', body);
    const { type, amount, description, bank_name, account_type, category } = body;
    
    // Validate required fields
    if (!type || !amount || !description || !bank_name || !account_type) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, description, bank_name, account_type' },
        { status: 400 }
      );
    }
    
    // Prepare transaction data - only include fields that exist in the table
    const now = new Date();
    const transactionData = {
      user_id: user.id, // Add user_id for proper data isolation
      date: now.toISOString(),
      description: description.trim(),
      amount: parseFloat(amount),
      type: type, // 'income' or 'expense'
      source: 'manual',
      account_type: account_type, // From balances table
      bank_name: bank_name.trim(),
      category: category ? category.trim() : null, // Optional category
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    console.log('📝 Transaction data to insert:', transactionData);
    
    // Insert the transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('all_transactions')
      .insert([transactionData])
      .select()
      .single();
    
    if (error) {
      console.error('💥 Detailed error creating transaction:', error);
      console.error('💥 Error code:', error.code);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error details:', error.details);
      console.error('💥 Error hint:', error.hint);
      return NextResponse.json(
        { 
          error: 'Failed to create transaction', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Created manual transaction:', transaction.id);
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('🔥 Unexpected error in POST all-transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
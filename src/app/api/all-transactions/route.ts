import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const client = supabaseAdmin || supabase;
    
    console.log('🔍 Fetching all transactions from unified table...');
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const bankName = searchParams.get('bank_name');
    const accountType = searchParams.get('account_type');
    const timeRange = searchParams.get('time_range');
    
    // Build the query
    let query = client
      .from('all_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    // Apply filters if provided
    if (source) {
      query = query.eq('source', source);
    }
    
    if (bankName) {
      query = query.eq('bank_name', bankName);
    }
    
    if (accountType) {
      query = query.eq('account_type', accountType);
    }
    
    if (timeRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '60days':
          startDate.setDate(now.getDate() - 60);
          break;
        default:
          // No time filter
          break;
      }
      
      if (timeRange !== 'all') {
        query = query.gte('date', startDate.toISOString());
      }
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
    const client = supabaseAdmin || supabase;
    
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
    const { data: transaction, error } = await client
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
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const client = supabaseAdmin || supabase;
    
    console.log('🔍 Fetching email transactions from database...');
    
    const { data: emailTransactions, error } = await client
      .from('email_transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching email transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email transactions' },
        { status: 500 }
      );
    }

    // Transform email transactions to match the TransactionData interface
    const transformedTransactions = emailTransactions.map(tx => ({
      id: tx.id,
      date: new Date(tx.date),
      description: tx.description,
      amount: parseFloat(tx.amount),
      closing_balance: tx.balance ? parseFloat(tx.balance) : null,
      category: tx.category,
      type: tx.type === 'debit' ? 'expense' : 'income', // Transform to match existing format
      source: tx.bank_name,
      account_type: tx.account_type === 'credit_card' ? 'Credit Card' : 'Bank Account',
      bank_name: tx.bank_name,
      statement_id: null, // Email transactions don't have statement_id
      created_at: new Date(tx.created_at),
      updated_at: new Date(tx.updated_at),
      // Additional email-specific fields
      gmail_message_id: tx.gmail_message_id,
      reward_points: tx.reward_points ? parseFloat(tx.reward_points) : null,
      mode: tx.mode,
      reference_number: tx.reference_number
    }));

    console.log(`✅ Fetched ${transformedTransactions.length} email transactions`);

    return NextResponse.json(transformedTransactions);

  } catch (error) {
    console.error('Error in email transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
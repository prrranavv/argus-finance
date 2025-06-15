import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { userId } = authResult;

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('🔑 Gmail Save Transactions API: Processing for user:', userId);

    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Transactions array is required' },
        { status: 400 }
      );
    }

    const client = supabaseAdmin;
    console.log(`💰 Saving ${transactions.length} transactions to database for user ${userId}...`);

    let savedTransactions = 0;
    let updatedTransactions = 0;
    const errors = [];

    for (const transaction of transactions) {
      try {
        console.log(`💰 Processing transaction from email ${transaction.gmail_message_id}:`, transaction);
        
        // Get email_id from database using gmail_message_id for this user
        const { data: emailRecord } = await client
          .from('emails')
          .select('id')
          .eq('gmail_message_id', transaction.gmail_message_id)
          .eq('user_id', userId)
          .single();
        
        if (!emailRecord) {
          throw new Error(`Email not found for gmail_message_id: ${transaction.gmail_message_id}`);
        }
        
        const email_id = emailRecord.id;
        
        // Convert transaction type from debit/credit to expense/income
        const transactionType = transaction.type === 'debit' ? 'expense' : 'income';
        
        // Convert account_type format if needed
        let accountType = transaction.account_type;
        if (accountType === 'credit_card') {
          accountType = 'Credit Card';
        } else if (accountType === 'bank_account') {
          accountType = 'Bank Account';
        }

        // Create unified transaction data structure
        const transactionData = {
          date: new Date(transaction.date).toISOString(),
          description: transaction.description,
          amount: parseFloat(transaction.amount) || 0,
          category: transaction.category || null,
          type: transactionType,
          account_type: accountType,
          bank_name: transaction.bank_name || 'Unknown',
          source: 'email',
          email_id: email_id,
          gmail_message_id: transaction.gmail_message_id,
          reference_number: transaction.reference_number || null,
          user_id: userId
        };

        // Check if transaction already exists in all_transactions for this user
        const { data: existingTransaction } = await client
          .from('all_transactions')
          .select('id')
          .eq('gmail_message_id', transaction.gmail_message_id)
          .eq('source', 'email')
          .eq('user_id', userId)
          .single();

        if (existingTransaction) {
          // Update existing transaction
          const { error: updateTxError } = await client
            .from('all_transactions')
            .update(transactionData)
            .eq('id', existingTransaction.id);

          if (updateTxError) {
            console.error('Transaction update error:', updateTxError);
            throw new Error(`Failed to update transaction: ${updateTxError.message}`);
          }
          
          updatedTransactions++;
          console.log(`💰 Updated transaction: ${transaction.description} - ₹${transaction.amount}`);
        } else {
          // Insert new transaction
          const { error: insertTxError } = await client
            .from('all_transactions')
            .insert(transactionData);

          if (insertTxError) {
            console.error('Transaction insert error:', insertTxError);
            console.error('Transaction data:', transactionData);
            throw new Error(`Failed to insert transaction: ${insertTxError.message}`);
          }
          
          savedTransactions++;
          console.log(`💰 Saved new transaction: ${transaction.description} - ₹${transaction.amount}`);
        }

      } catch (transactionError) {
        console.error(`Error processing transaction for email ${transaction.gmail_message_id}:`, transactionError);
        errors.push({
          gmail_message_id: transaction.gmail_message_id,
          error: transactionError instanceof Error ? transactionError.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Transaction save completed: ${savedTransactions} new transactions, ${updatedTransactions} updated transactions`);

    return NextResponse.json({
      success: true,
      message: `Processed ${savedTransactions + updatedTransactions} transactions (${savedTransactions} new, ${updatedTransactions} updated)`,
      savedTransactions,
      updatedTransactions,
      totalTransactions: savedTransactions + updatedTransactions,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Transaction save error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save transactions: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
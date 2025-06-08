import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { processFinancialStatement } from '@/lib/file-processor';
import crypto from 'crypto';

// Function to generate file hash
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashSum = crypto.createHash('sha256');
  hashSum.update(new Uint8Array(arrayBuffer));
  return hashSum.digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV, PDF, or Excel file.' },
        { status: 400 }
      );
    }

    // Generate file hash for content-based deduplication
    const fileHash = await generateFileHash(file);
    
    // Check for duplicate files by name and size
    const { data: existingStatement, error: findError } = await supabase
      .from('statements')
      .select('*, transactions(*)')
      .eq('file_name', file.name)
      .eq('file_size', file.size)
      .eq('processed', true)
      .single();

    if (!findError && existingStatement) {
      // Include metadata for duplicate files too so they can show updated titles
      const metadata = existingStatement.transactions && existingStatement.transactions.length > 0 ? {
        bankName: existingStatement.transactions[0].bank_name,
        accountType: existingStatement.transactions[0].account_type,
        dateRange: {
          start: Math.min(...existingStatement.transactions.map((t: { date: string }) => new Date(t.date).getTime())),
          end: Math.max(...existingStatement.transactions.map((t: { date: string }) => new Date(t.date).getTime()))
        }
      } : null;

      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'File has already been processed',
        data: {
          statementId: existingStatement.id,
          transactionCount: existingStatement.transactions?.length || 0,
          uploadedAt: existingStatement.uploaded_at,
          metadata
        },
      });
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    console.log('🎯 STEP 1: Attempting file upload to storage...');
    const { error: uploadError } = await supabase.storage
      .from('statements')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ STEP 1 FAILED - Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage', 
        details: uploadError 
      }, { status: 500 });
    }
    
    console.log('✅ STEP 1 SUCCESS - File uploaded to storage');

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('statements')
      .getPublicUrl(fileName);

    // Create statement record using admin client to bypass RLS
    const client = supabaseAdmin || supabase;
    console.log('🎯 STEP 2: Attempting database insert...');
    console.log('Using client:', supabaseAdmin ? 'ADMIN (service role)' : 'ANON (regular)');
    
    const statementData = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_hash: fileHash,
      file_url: publicUrl,
      processed: false,
    };
    console.log('Statement data to insert:', statementData);
    
    const { data: statement, error: statementError } = await client
      .from('statements')
      .insert(statementData)
      .select()
      .single();

    if (statementError || !statement) {
      console.error('❌ STEP 2 FAILED - Database insert error:', statementError);
      return NextResponse.json({ 
        error: 'Failed to create statement record', 
        details: statementError 
      }, { status: 500 });
    }
    
    console.log('✅ STEP 2 SUCCESS - Statement record created');

    try {
      // Process the file with OpenAI
      const processedData = await processFinancialStatement(file);

      // Check for duplicate transactions before inserting
      const uniqueTransactions = [];
      
      for (const transaction of processedData.transactions) {
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('date', new Date(transaction.date).toISOString().split('T')[0])
          .eq('description', transaction.description)
          .eq('amount', transaction.amount)
          .eq('type', transaction.type)
          .single();

        // Only add if transaction doesn't exist
        if (!existingTransaction) {
          uniqueTransactions.push(transaction);
        }
      }

      // Save only unique transactions to database
      const transactionInserts = uniqueTransactions.map(transaction => ({
        date: new Date(transaction.date).toISOString().split('T')[0],
              description: transaction.description,
              amount: transaction.amount,
        closing_balance: transaction.closingBalance,
        opening_balance: transaction.openingBalance || null,
        running_balance: transaction.runningBalance || null,
              category: transaction.category,
              type: transaction.type,
              source: file.type.includes('pdf') ? 'bank' : 'csv',
        account_type: transaction.accountType,
        bank_name: transaction.bankName,
        credit_limit: transaction.creditLimit || null,
        due_date: transaction.dueDate || null,
        reward_points: transaction.rewardPoints || null,
        merchant_category: transaction.merchantCategory || null,
              mode: transaction.mode || null,
        statement_id: statement.id
      }));

      const { data: transactions, error: transError } = await client
        .from('transactions')
        .insert(transactionInserts)
        .select();

      if (transError) {
        console.error('Error creating transactions:', transError);
        // Update statement as failed
        await client
          .from('statements')
          .update({ processed: false })
          .eq('id', statement.id);

        return NextResponse.json({ error: 'Failed to create transactions' }, { status: 500 });
      }

      // Update statement as processed
      const { error: updateError } = await client
        .from('statements')
        .update({ processed: true })
        .eq('id', statement.id);

      if (updateError) {
        console.error('Error updating statement:', updateError);
      }

      const duplicatesSkipped = processedData.transactions.length - uniqueTransactions.length;

      return NextResponse.json({
        success: true,
        data: {
          statementId: statement.id,
          transactionCount: transactions?.length || 0,
          duplicatesSkipped,
          summary: processedData.summary,
          // Add metadata for updated file titles using the original processed data
          metadata: processedData.transactions.length > 0 ? {
            bankName: processedData.transactions[0].bankName,
            accountType: processedData.transactions[0].accountType,
            dateRange: {
              start: Math.min(...processedData.transactions.map(t => new Date(t.date).getTime())),
              end: Math.max(...processedData.transactions.map(t => new Date(t.date).getTime()))
            }
          } : null
        },
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update statement with error status
      await client
        .from('statements')
        .update({ processed: false })
        .eq('id', statement.id);

      return NextResponse.json(
        { 
          error: 'Failed to process file', 
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
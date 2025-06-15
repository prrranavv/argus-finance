import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { processFinancialStatement } from '@/lib/file-processor';
import crypto from 'crypto';

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

// Function to generate file hash
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashSum = crypto.createHash('sha256');
  hashSum.update(new Uint8Array(arrayBuffer));
  return hashSum.digest('hex');
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

    console.log('🔑 Process Statement API: Processing for user:', user.id);

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
    
    // Check for duplicate files by name and size for this user
    const { data: existingStatement, error: findError } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('file_name', file.name)
      .eq('file_size', file.size)
      .eq('processed', true)
      .eq('user_id', user.id)
      .single();

    if (!findError && existingStatement) {
      // Get transactions for this statement
      const { data: statementTransactions } = await supabaseAdmin
        .from('all_transactions')
        .select('*')
        .eq('statement_id', existingStatement.id)
        .eq('source', 'statement')
        .eq('user_id', user.id);
      
      // Include metadata for duplicate files too so they can show updated titles
      const metadata = statementTransactions && statementTransactions.length > 0 ? {
        bankName: statementTransactions[0].bank_name,
        accountType: statementTransactions[0].account_type,
        dateRange: {
          start: Math.min(...statementTransactions.map((t: { date: string }) => new Date(t.date).getTime())),
          end: Math.max(...statementTransactions.map((t: { date: string }) => new Date(t.date).getTime()))
        }
      } : null;

      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'File has already been processed',
        data: {
          statementId: existingStatement.id,
          transactionCount: statementTransactions?.length || 0,
          uploadedAt: existingStatement.uploaded_at,
          metadata
        },
      });
    }

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    console.log('🎯 STEP 1: Attempting file upload to storage...');
    const { error: uploadError } = await supabaseAdmin!.storage
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
    const { data: { publicUrl } } = supabaseAdmin!.storage
      .from('statements')
      .getPublicUrl(fileName);

    // Create statement record using admin client to bypass RLS
    const client = supabaseAdmin!;
    console.log('🎯 STEP 2: Attempting database insert...');
    console.log('Using client: ADMIN (service role)');
    
    const statementData = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_hash: fileHash,
      file_url: publicUrl,
      processed: false,
      user_id: user.id,
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
        // Step 1: Check for same-source duplicates (a statement processed twice)
        const { data: sameSourceDuplicate } = await supabaseAdmin
          .from('all_transactions')
          .select('id')
          .eq('source', 'statement')
          .eq('date', new Date(transaction.date).toISOString().split('T')[0])
          .eq('description', transaction.description)
          .eq('amount', transaction.amount)
          .eq('type', transaction.type)
          .eq('bank_name', transaction.bankName)
          .eq('user_id', user.id)
          .single();

        if (sameSourceDuplicate) {
          continue; // Skip this transaction
        }

        // Step 2: Check for cross-source duplicates (email already processed)
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(transactionDate.setHours(0, 0, 0, 0));
        const endDate = new Date(transactionDate.setHours(23, 59, 59, 999));

        const { data: crossSourceDuplicate } = await supabaseAdmin
          .from('all_transactions')
          .select('id')
          .eq('source', 'email')
          .eq('description', transaction.description)
          .eq('amount', transaction.amount)
          .eq('bank_name', transaction.bankName)
          .eq('user_id', user.id)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())
          .single();

        // Only add if no duplicate is found from any source
        if (!crossSourceDuplicate) {
          uniqueTransactions.push(transaction);
        }
      }

      // Save only unique transactions to the unified all_transactions table
      const transactionInserts = uniqueTransactions.map(transaction => ({
        date: new Date(transaction.date).toISOString().split('T')[0],
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        source: 'statement',
        account_type: transaction.accountType,
        bank_name: transaction.bankName,
        statement_id: statement.id,
        user_id: user.id,
        // No more fields for these as they've been moved to the balances table
        // We'll need to add balances table entry separately if needed
      }));

      const { data: transactions, error: transError } = await client
        .from('all_transactions')
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
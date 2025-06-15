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

// GET single transaction by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    console.log('🔑 Fetching transaction for user:', user.id);

    const { id } = await context.params;

    const { data: transaction, error } = await supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own transactions
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error in GET transaction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE transaction by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const client = supabaseAdmin!;
    const { id } = await context.params;
    const body = await request.json();

    console.log('🔄 Updating transaction:', id, body);

    // Only allow updating certain fields for safety
    const allowedFields = ['description', 'amount', 'category', 'type'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: transaction, error } = await client
      .from('all_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to update transaction', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Updated transaction:', transaction.id);
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error in PUT transaction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE transaction by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const client = supabaseAdmin!;
    const { id } = await context.params;

    console.log('🗑️ Deleting transaction:', id);

    // First check if transaction exists and get its details
    const { data: existingTransaction, error: fetchError } = await client
      .from('all_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of manual transactions for safety
    if (existingTransaction.source !== 'manual') {
      return NextResponse.json(
        { error: 'Only manual transactions can be deleted' },
        { status: 403 }
      );
    }

    const { error } = await client
      .from('all_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete transaction', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Deleted transaction:', id);
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE transaction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
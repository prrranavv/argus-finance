import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET single transaction by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = supabaseAdmin || supabase;
    const { id } = params;

    const { data: transaction, error } = await client
      .from('all_transactions')
      .select('*')
      .eq('id', id)
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
  { params }: { params: { id: string } }
) {
  try {
    const client = supabaseAdmin || supabase;
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const client = supabaseAdmin || supabase;
    const { id } = params;

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
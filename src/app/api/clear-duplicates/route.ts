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

export async function POST() {
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

    console.log('🔑 Clear Duplicates API: Processing for user:', user.id);

    // Find duplicate transactions based on date, description, amount, and type for this user
    const { data: transactions, error } = await supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('description', { ascending: true })
      .order('amount', { ascending: true })
      .order('type', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    const duplicates = [];
    const seen = new Set();

    for (const transaction of transactions || []) {
      // Include source in the key to avoid cross-source "duplicates"
      const key = `${transaction.source}-${new Date(transaction.date).toISOString()}-${transaction.description}-${transaction.amount}-${transaction.type}`;
      
      if (seen.has(key)) {
        duplicates.push(transaction.id);
      } else {
        seen.add(key);
      }
    }

    if (duplicates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        duplicatesRemoved: 0
      });
    }

    // Delete duplicate transactions (keeping the first occurrence of each)
    const { error: deleteError } = await supabaseAdmin
      .from('all_transactions')
      .delete()
      .in('id', duplicates);

    if (deleteError) {
      console.error('Error deleting duplicates:', deleteError);
      return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${duplicates.length} duplicate transactions`,
      duplicatesRemoved: duplicates.length
    });

  } catch (error) {
    console.error('Error clearing duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to clear duplicates' },
      { status: 500 }
    );
  }
} 
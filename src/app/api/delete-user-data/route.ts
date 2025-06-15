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

export async function DELETE(request: NextRequest) {
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

    console.log('🔥 Delete User Data API: Processing complete data deletion for user:', user.id);

    // Get confirmation from request body
    const body = await request.json();
    const { confirmed } = body;

    if (!confirmed) {
      return NextResponse.json({ error: 'Deletion must be confirmed' }, { status: 400 });
    }

    // Get counts before deletion for response
    const [transactionsResult, balancesResult, emailsResult, statementsResult] = await Promise.all([
      supabaseAdmin.from('all_transactions').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabaseAdmin.from('balances').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabaseAdmin.from('emails').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabaseAdmin.from('statements').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);

    const transactionCount = transactionsResult.count || 0;
    const balanceCount = balancesResult.count || 0;
    const emailCount = emailsResult.count || 0;
    const statementCount = statementsResult.count || 0;

    // Delete all user data in the correct order (respecting foreign key constraints)
    console.log('🗑️ Deleting all balances...');
    const { error: balancesError } = await supabaseAdmin
      .from('balances')
      .delete()
      .eq('user_id', user.id);

    if (balancesError) {
      console.error('Error deleting balances:', balancesError);
      return NextResponse.json({ error: 'Failed to delete balances' }, { status: 500 });
    }

    console.log('🗑️ Deleting all transactions...');
    const { error: transError } = await supabaseAdmin
      .from('all_transactions')
      .delete()
      .eq('user_id', user.id);

    if (transError) {
      console.error('Error deleting transactions:', transError);
      return NextResponse.json({ error: 'Failed to delete transactions' }, { status: 500 });
    }

    console.log('🗑️ Deleting all emails...');
    const { error: emailsError } = await supabaseAdmin
      .from('emails')
      .delete()
      .eq('user_id', user.id);

    if (emailsError) {
      console.error('Error deleting emails:', emailsError);
      return NextResponse.json({ error: 'Failed to delete emails' }, { status: 500 });
    }

    console.log('🗑️ Deleting all statements...');
    const { error: statementsError } = await supabaseAdmin
      .from('statements')
      .delete()
      .eq('user_id', user.id);

    if (statementsError) {
      console.error('Error deleting statements:', statementsError);
      return NextResponse.json({ error: 'Failed to delete statements' }, { status: 500 });
    }

    console.log('🗑️ Deleting user profile...');
    const { error: userProfileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id);

    if (userProfileError) {
      console.error('Error deleting user profile:', userProfileError);
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
    }

    console.log('🗑️ Deleting user from Supabase auth...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 });
    }

    console.log('✅ Successfully deleted all user data for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'All user data has been permanently deleted',
      deletedData: {
        transactions: transactionCount,
        balances: balanceCount,
        emails: emailCount,
        statements: statementCount,
        userProfile: 1,
        authAccount: 1
      }
    });

  } catch (error) {
    console.error('Error during complete user data deletion:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data completely' },
      { status: 500 }
    );
  }
} 
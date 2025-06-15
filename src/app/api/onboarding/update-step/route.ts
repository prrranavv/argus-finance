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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { step, completed } = body;

    if (!step || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Step and completed status are required' }, { status: 400 });
    }

    console.log('🔑 Update Onboarding Step API:', step, completed, 'for user:', user.id);

    // Use the database function to update onboarding step
    const { data, error } = await supabaseAdmin
      .rpc('update_onboarding_step', {
        p_user_id: user.id,
        p_step: step,
        p_completed: completed
      });

    if (error) {
      console.error('Error updating onboarding step:', error);
      return NextResponse.json({ error: 'Failed to update onboarding step' }, { status: 500 });
    }

    // Fetch updated onboarding status
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated onboarding:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated onboarding' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      onboarding
    });

  } catch (error) {
    console.error('Error in update onboarding step API:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding step' },
      { status: 500 }
    );
  }
} 
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

export async function GET() {
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

    console.log('🔑 Onboarding Status API: Fetching data for user:', user.id);

    // Fetch onboarding status
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('user_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      console.error('Error fetching onboarding:', onboardingError);
      return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
    }

    // If no onboarding record exists, create one
    if (!onboarding) {
      const { data: newOnboarding, error: createError } = await supabaseAdmin
        .from('user_onboarding')
        .insert({
          user_id: user.id,
          current_step: 'personal_info',
          steps_completed: {
            personal_info: false,
            accounts: false,
            integrations: false
          },
          is_completed: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating onboarding record:', createError);
        return NextResponse.json({ error: 'Failed to create onboarding record' }, { status: 500 });
      }

      // Fetch user accounts
      const { data: accounts } = await supabaseAdmin
        .from('user_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      // Fetch user integrations
      const { data: integrations } = await supabaseAdmin
        .from('user_integrations')
        .select('id, user_id, integration_type, is_active, last_sync_at, created_at, updated_at')
        .eq('user_id', user.id);

      return NextResponse.json({
        onboarding: newOnboarding,
        accounts: accounts || [],
        integrations: integrations || []
      });
    }

    // Fetch user accounts
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Fetch user integrations (excluding encrypted tokens)
    const { data: integrations, error: integrationsError } = await supabaseAdmin
      .from('user_integrations')
      .select('id, user_id, integration_type, is_active, last_sync_at, created_at, updated_at')
      .eq('user_id', user.id);

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({
      onboarding,
      accounts: accounts || [],
      integrations: integrations || []
    });

  } catch (error) {
    console.error('Error in onboarding status API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
} 
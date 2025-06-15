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

// Simple encryption for tokens (using base64 for now, can be enhanced)
function encryptToken(token: string): string {
  return Buffer.from(token).toString('base64');
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
    const { integration_type, access_token, access_token_secret, refresh_token, expires_at, additional_data } = body;

    if (!integration_type || !access_token) {
      return NextResponse.json({ error: 'Integration type and access token are required' }, { status: 400 });
    }

    if (!['gmail', 'splitwise'].includes(integration_type)) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    console.log('🔑 Add Integration API: Adding', integration_type, 'for user:', user.id);

    // Test the Splitwise token if it's a Splitwise integration
    if (integration_type === 'splitwise') {
      try {
        // Check if this is an OAuth token (has access_token_secret) or API key
        if (access_token_secret) {
          // This is an OAuth token - we'll skip validation here since it was already tested
          // in the callback flow via /api/splitwise/test endpoint
          console.log('✅ Splitwise OAuth token - validation skipped (already tested in callback)');
        } else {
          // This is an API key - validate it with Bearer token method
          const testResponse = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!testResponse.ok) {
            return NextResponse.json({ error: 'Invalid Splitwise API key' }, { status: 400 });
          }

          const userData = await testResponse.json();
          console.log('✅ Splitwise API key validated for user:', userData.user?.email);
        }
      } catch (error) {
        console.error('Error testing Splitwise token:', error);
        return NextResponse.json({ error: 'Failed to validate Splitwise token' }, { status: 400 });
      }
    }

    // Encrypt the tokens
    const encryptedAccessToken = encryptToken(access_token);
    const encryptedAccessTokenSecret = access_token_secret ? encryptToken(access_token_secret) : null;
    const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null;

    // Upsert the integration (replace if exists)
    const { data: integration, error } = await supabaseAdmin
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        integration_type,
        access_token_encrypted: encryptedAccessToken,
        access_token_secret_encrypted: encryptedAccessTokenSecret,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: expires_at || null,
        additional_data: additional_data || {},
        is_active: true,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,integration_type'
      })
      .select('id, user_id, integration_type, is_active, last_sync_at, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding integration:', error);
      return NextResponse.json({ error: 'Failed to add integration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      integration,
      message: `${integration_type === 'splitwise' ? 'Splitwise' : 'Gmail'} integration added successfully`
    });

  } catch (error) {
    console.error('Error in add integration API:', error);
    return NextResponse.json(
      { error: 'Failed to add integration' },
      { status: 500 }
    );
  }
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

    console.log('🔑 Get Integrations API: Fetching integrations for user:', user.id);

    // Fetch user integrations (excluding encrypted tokens)
    const { data: integrations, error } = await supabaseAdmin
      .from('user_integrations')
      .select('id, user_id, integration_type, is_active, last_sync_at, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      integrations: integrations || []
    });

  } catch (error) {
    console.error('Error in get integrations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
} 
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
    const { full_name } = body;

    if (!full_name || typeof full_name !== 'string') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    console.log('🔑 Update Auth Metadata API: Updating name for user:', user.id);

    // Update the auth user metadata using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          full_name: full_name
        }
      }
    );

    if (error) {
      console.error('Error updating auth metadata:', error);
      return NextResponse.json({ error: 'Failed to update auth metadata' }, { status: 500 });
    }

    console.log('✅ Auth metadata updated successfully for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Auth metadata updated successfully'
    });

  } catch (error) {
    console.error('Error in update auth metadata API:', error);
    return NextResponse.json(
      { error: 'Failed to update auth metadata' },
      { status: 500 }
    );
  }
} 
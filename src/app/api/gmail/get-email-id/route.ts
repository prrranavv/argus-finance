import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gmail_message_id = searchParams.get('gmail_message_id');

    if (!gmail_message_id) {
      return NextResponse.json(
        { error: 'gmail_message_id parameter is required' },
        { status: 400 }
      );
    }

    const client = supabaseAdmin || supabase;

    const { data: email, error } = await client
      .from('emails')
      .select('id')
      .eq('gmail_message_id', gmail_message_id)
      .single();

    if (error) {
      console.error('Error fetching email ID:', error);
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email_id: email.id,
      gmail_message_id
    });

  } catch (error) {
    console.error('Get email ID error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get email ID: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
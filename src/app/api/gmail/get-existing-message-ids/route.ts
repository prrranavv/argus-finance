import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Optional: YYYY-MM format
    
    const client = supabaseAdmin || supabase;

    // Build query
    let query = client
      .from('emails')
      .select('gmail_message_id, received_date');

    // Filter by month if provided
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      query = query
        .gte('received_date', startDate.toISOString())
        .lte('received_date', endDate.toISOString());
    } else {
      // Default to current month (matching Gmail API pattern: after end of previous month)
      const now = new Date();
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      // Set to end of day to match Gmail's "after" behavior
      previousMonthEnd.setHours(23, 59, 59, 999);
      
      query = query
        .gt('received_date', previousMonthEnd.toISOString());
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('Error fetching existing message IDs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch existing message IDs' },
        { status: 500 }
      );
    }

    const messageIds = emails.map(email => email.gmail_message_id);
    
    console.log(`📋 Found ${messageIds.length} existing emails in database for the specified period`);

    return NextResponse.json({
      success: true,
      messageIds,
      totalCount: messageIds.length,
      month: month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    });

  } catch (error) {
    console.error('Get existing message IDs error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get existing message IDs: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
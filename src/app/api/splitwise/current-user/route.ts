import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.SPLITWISE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Splitwise API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_current_user', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch current user from Splitwise',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Splitwise current user:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch current user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
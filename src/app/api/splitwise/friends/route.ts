import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.SPLITWISE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Splitwise API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://secure.splitwise.com/api/v3.0/get_friends', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch friends from Splitwise',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Splitwise friends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch friends', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
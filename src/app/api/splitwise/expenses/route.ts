import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.SPLITWISE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Splitwise API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const groupId = searchParams.get('group_id');
    const datedAfter = searchParams.get('dated_after');
    const datedBefore = searchParams.get('dated_before');

    let url = `https://secure.splitwise.com/api/v3.0/get_expenses?limit=${limit}`;
    
    if (groupId) {
      url += `&group_id=${groupId}`;
    }
    
    if (datedAfter) {
      url += `&dated_after=${datedAfter}`;
    }
    
    if (datedBefore) {
      url += `&dated_before=${datedBefore}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Splitwise API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch expenses from Splitwise',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Splitwise expenses:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch expenses', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
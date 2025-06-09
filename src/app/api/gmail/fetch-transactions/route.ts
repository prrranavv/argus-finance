import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'This endpoint has been replaced with a two-step process',
    newEndpoints: {
      step1: '/api/gmail/fetch-emails - Fetch emails from Gmail',
      step2: '/api/gmail/process-email - Process individual emails with OpenAI'
    },
    instructions: [
      '1. First call /api/gmail/fetch-emails to get your emails',
      '2. Then call /api/gmail/process-email for each email you want to analyze',
      '3. This gives you better control and visibility into the process'
    ],
    migration_note: 'Please update your frontend to use the new two-step flow'
  }, { status: 200 });
} 
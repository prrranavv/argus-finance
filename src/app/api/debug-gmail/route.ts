import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Starting Gmail debug test...');
    
    // Step 1: Get existing message IDs (current month)
    const existingResponse = await fetch('http://localhost:3000/api/gmail/get-existing-message-ids');
    const existingResult = await existingResponse.json();
    console.log('📋 Existing emails:', JSON.stringify(existingResult, null, 2));

    // Step 2: Fetch emails (smart sync)
    const fetchResponse = await fetch('http://localhost:3000/api/gmail/fetch-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        excludeMessageIds: existingResult.messageIds || [],
        maxMessages: 10 // Limit for debug
      }),
    });

    const fetchResult = await fetchResponse.json();
    console.log('📧 Fetch result:', JSON.stringify(fetchResult, null, 2));

    if (!fetchResponse.ok) {
      throw new Error(fetchResult.error);
    }

    // Step 3: Clean emails
    const cleanResponse = await fetch('http://localhost:3000/api/gmail/clean-email-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails: fetchResult.emails }),
    });

    const cleanResult = await cleanResponse.json();
    console.log('🧽 Clean result count:', cleanResult.emails?.length);

    if (!cleanResponse.ok) {
      throw new Error(cleanResult.error);
    }

    // Step 4: Analyze first email
    const firstEmail = cleanResult.emails[0];
    if (firstEmail) {
      const analysisResponse = await fetch('http://localhost:3000/api/gmail/process-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: firstEmail }),
      });

      const analysisResult = await analysisResponse.json();
      console.log('🤖 Analysis result:', JSON.stringify(analysisResult, null, 2));

      // Step 5: Save the emails (should be done automatically in the app)
      const saveEmailResponse = await fetch('http://localhost:3000/api/gmail/save-email-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [firstEmail]
        }),
      });

      const saveEmailResult = await saveEmailResponse.json();
      console.log('📧 Email save result:', JSON.stringify(saveEmailResult, null, 2));

      // Step 6: Save the transaction if it exists
      let saveTransactionResult = null;
      if (analysisResult.success && analysisResult.transaction) {
        const saveTransactionResponse = await fetch('http://localhost:3000/api/gmail/save-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: [analysisResult.transaction]
          }),
        });

        saveTransactionResult = await saveTransactionResponse.json();
        console.log('💰 Transaction save result:', JSON.stringify(saveTransactionResult, null, 2));
      }

      return NextResponse.json({
        success: true,
        existing: existingResult,
        fetch: fetchResult,
        clean: { count: cleanResult.emails?.length },
        analysis: analysisResult,
        saveEmail: saveEmailResult,
        saveTransaction: saveTransactionResult
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No emails found to process'
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
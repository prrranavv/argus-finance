import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email data is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    console.log(`🤖 Processing email from ${email.from} with OpenAI...`);
    
    const prompt = `
Analyze this email content and extract comprehensive information for both email metadata and transaction details if any exist.

Email Subject: ${email.subject}
Email From: ${email.from}
Email Date: ${email.date}
Email Content: ${email.cleanedBody || email.fullBody || email.body}

Return a JSON object with the following structure:

{
  "email_info": {
    "account_type": "credit_card" | "bank_account" | null,
    "bank_name": "string (HDFC, Axis, HDFC Diners, Axis Flipkart, etc.)",
    "is_relevant": true | false
  },
  "transaction": {
    "amount": number (positive number always),
    "type": "credit" | "debit",
    "description": "string (cleaned merchant/transaction description)",
    "date": "YYYY-MM-DD",
    "account_type": "credit_card" | "bank_account",
    "bank_name": "string (same as above)",
    "category": "string (food, shopping, bills, travel, etc.)",
    "balance": number,
    "reward_points": number,
    "mode": "string (upi, direct_bank_transfer, card, cash, etc.)",
    "reference_number": "string"
  }
}

Guidelines:
1. ONLY extract information that is explicitly present or clearly inferable from the email content
2. DO NOT hallucinate or make up any data
3. Clean up merchant/description names intelligently:
   - "Zomato Limited" → "Zomato"
   - "4 P S India Private Li" → "4 P S"
   - "SWIGGY*ORDER" → "Swiggy"
   - "HIMANSHU GOYAL JT1" → "Himanshu Goyal"
   - "AMAZON PAY INDIA PVT LTD" → "Amazon Pay"
   - "PAYTM-UPI" → "Paytm"
   - "GOOGLE PAY-UPI" → "Google Pay"
   - "PHONEPE-UPI" → "PhonePe"
   - Remove suffixes like: "PVT LTD", "PRIVATE LIMITED", "LTD", "INC", "CORP"
   - Remove prefixes like: "UPI-", "*ORDER", "*TXN"
   - Remove reference codes and IDs at the end
   - Keep essential identifiers but make them readable
   - For person names, keep full name but remove transaction IDs
4. If no transaction exists, set transaction to null
5. If any field is not applicable or not present, omit it from the response
6. Use standard bank names: HDFC, Axis, ICICI, SBI, etc.
7. For credit cards: HDFC Diners, Axis Flipkart, HDFC Regalia, etc.
8. Amount should always be positive number, use type field to indicate debit/credit
9. Infer account_type from email sender and content context
10. Set is_relevant to true if any financial/transaction content is found, otherwise false
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial email and transaction extraction expert. Extract structured data from banking/financial emails. Be precise, only extract information that's clearly present, never hallucinate data. Return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 800,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    
    if (result) {
      try {
        const extractedData = JSON.parse(result);
        
        // Check if we have transaction data
        if (extractedData.transaction && extractedData.transaction.amount !== undefined) {
          const transaction = {
            ...extractedData.transaction,
            email_id: email.id,
            gmail_message_id: email.id,
            email_subject: email.subject,
            email_from: email.from,
            email_date: email.date,
            processed_at: new Date().toISOString()
          };
          
          console.log(`✅ Transaction found in email from ${email.from}`);
          
          return NextResponse.json({
            success: true,
            transaction,
            email_info: extractedData.email_info,
            message: 'Transaction extracted successfully'
          });
        } else {
          // No transaction found but we have email metadata
          console.log(`ℹ️ No transaction found in email from ${email.from}`);
          
          return NextResponse.json({
            success: true,
            transaction: null,
            email_info: extractedData.email_info,
            message: extractedData.email_info?.is_relevant === false 
              ? 'Email content is not transaction-related' 
              : 'No transaction found in this email'
          });
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Raw response:', result);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse extraction data from OpenAI response',
          message: 'Invalid JSON response from AI'
        }, { status: 500 });
      }
    }
    
    console.log(`ℹ️ No response from OpenAI for email from ${email.from}`);
    
    return NextResponse.json({
      success: false,
      error: 'No response from OpenAI',
      message: 'Failed to get AI analysis'
    }, { status: 500 });

  } catch (error) {
    console.error('OpenAI processing error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process email with OpenAI: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
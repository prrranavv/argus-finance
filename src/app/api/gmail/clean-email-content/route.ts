import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth } from '@/lib/auth-middleware';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { userId } = authResult;

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    console.log(`🧹 Cleaning ${emails.length} emails with OpenAI in parallel...`);

    // Process all emails in parallel for faster processing
    const cleaningPromises = emails.map(async (email: any) => {
      try {
        console.log(`🧹 Cleaning email from ${email.from}...`);
        
        const prompt = `
Please clean and format this email content by:
1. Removing HTML tags and formatting
2. Removing email headers, tracking pixels, and metadata
3. Removing unsubscribe links and promotional footers
4. Keeping only the main email body content
5. Preserving important information like amounts, dates, transaction details
6. Format the output as clean, readable text

Email Subject: ${email.subject}
Email From: ${email.from}
Email Content: ${email.fullBody || email.body}

Return ONLY the cleaned email body content, no explanations or markdown formatting.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert email content cleaner. Extract and clean the main content from emails, removing HTML, headers, footers, and irrelevant information while preserving important details like transaction information, amounts, dates, and key business content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0,
          max_tokens: 1000,
        });

        const cleanedContent = completion.choices[0]?.message?.content?.trim();
        
        return {
          ...email,
          cleanedBody: cleanedContent || email.body || 'Content could not be cleaned',
          cleaned: true
        };
        
      } catch (error) {
        console.error(`Error cleaning email from ${email.from}:`, error);
        return {
          ...email,
          cleanedBody: email.body || 'Error cleaning content',
          cleaned: false,
          cleaningError: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const cleanedEmails = await Promise.all(cleaningPromises);

    console.log(`✅ Successfully cleaned ${cleanedEmails.filter(e => e.cleaned).length}/${emails.length} emails`);

    return NextResponse.json({
      success: true,
      emails: cleanedEmails,
      totalEmails: emails.length,
      cleanedCount: cleanedEmails.filter(e => e.cleaned).length,
      message: `Cleaned ${cleanedEmails.filter(e => e.cleaned).length} out of ${emails.length} emails`
    });

  } catch (error) {
    console.error('Email cleaning error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clean email content: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
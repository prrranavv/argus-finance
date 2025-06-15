import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireAuth } from '@/lib/auth-middleware';
import { getValidGmailToken, updateLastSync } from '@/lib/vault-tokens';

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://argus-finance.vercel.app/api/gmail/test'
    : 'http://localhost:3000/api/gmail/test'
);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { userId } = authResult;

    const { 
      maxMessages, 
      dateRange, 
      excludeMessageIds = [] 
    } = await request.json();

    // Check if we have the required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Missing Google API credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.' },
        { status: 500 }
      );
    }

    // Get user's Gmail token from database
    const accessToken = await getValidGmailToken(userId);
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Gmail authentication required. Please connect your Gmail account in the onboarding or settings.',
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    // Set credentials with user's token
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build Gmail query
    let query = '';
    if (dateRange) {
      const { startDate, endDate } = dateRange;
      if (startDate) query += `after:${startDate} `;
      if (endDate) query += `before:${endDate} `;
    } else {
      // Default to current month - use end of previous month (matches Gmail web interface)
      const now = new Date();
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const startDateStr = previousMonthEnd.toISOString().split('T')[0].replace(/-/g, '/');
      query = `after:${startDateStr}`;
    }

    console.log(`📧 Fetching emails from Gmail with query: "${query}"`);
    
    // Fetch emails with date range
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query.trim(),
      maxResults: maxMessages || 500, // Default to 500 for current month
    });

    const messages = messagesResponse.data.messages || [];
    
    if (messages.length === 0) {
      return NextResponse.json({
        emails: [],
        message: 'No emails found for the specified date range'
      });
    }

    // Filter out messages that already exist in database
    const newMessages = messages.filter(message => !excludeMessageIds.includes(message.id));
    
    if (newMessages.length === 0) {
      return NextResponse.json({
        emails: [],
        message: `Found ${messages.length} emails but all already exist in database`,
        totalFound: messages.length,
        newEmails: 0,
        existingEmails: messages.length
      });
    }

    console.log(`📧 Found ${messages.length} emails total, ${newMessages.length} new emails to process...`);

    // Fetch message contents
    const emailDetails = await Promise.all(
      newMessages.map(async (message, index) => {
        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          // Extract email content
          let body = '';
          let subject = '';
          let from = '';
          let date = '';
          let attachments: any[] = [];

          // Get headers
          const headers = messageData.data.payload?.headers || [];
          subject = headers.find(h => h.name === 'Subject')?.value || '';
          from = headers.find(h => h.name === 'From')?.value || '';
          date = headers.find(h => h.name === 'Date')?.value || '';

          // Extract body content and attachments
          const extractContent = (part: any) => {
            // Check for attachments
            if (part.filename && part.filename.length > 0) {
              attachments.push({
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.body?.size || 0,
                attachmentId: part.body?.attachmentId
              });
            }

            // Extract text content
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString();
            } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
              // Use HTML content as fallback if no plain text
              const htmlContent = Buffer.from(part.body.data, 'base64').toString();
              // Basic HTML to text conversion (remove tags)
              body += htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }

            // Recursively check parts
            if (part.parts) {
              part.parts.forEach(extractContent);
            }
          };

          const payload = messageData.data.payload;
          if (payload?.body?.data) {
            body = Buffer.from(payload.body.data, 'base64').toString();
          } else if (payload?.parts) {
            payload.parts.forEach(extractContent);
          }

          return {
            id: message.id,
            subject: subject, // Full subject, no truncation
            from,
            date,
            body: body.substring(0, 1000), // Limit for display purposes
            fullBody: body, // Full content for processing
            attachments,
            index: index + 1,
            messageSize: messageData.data.sizeEstimate || 0
          };
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          return {
            id: message.id,
            subject: 'Error loading email',
            from: 'Unknown',
            date: '',
            body: 'Failed to load email content',
            fullBody: '',
            index: index + 1,
            error: true
          };
        }
      })
    );

    console.log(`✅ Successfully fetched ${emailDetails.length} new emails`);

    // Update last sync timestamp
    await updateLastSync(userId, 'gmail');

    return NextResponse.json({
      emails: emailDetails,
      totalEmails: emailDetails.length,
      totalFound: messages.length,
      newEmails: emailDetails.length,
      existingEmails: messages.length - emailDetails.length,
      message: `Successfully fetched ${emailDetails.length} new emails (${messages.length} total found)`
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json(
        { 
          error: 'Gmail access token expired. Please reconnect your Gmail account.',
          requiresReauth: true
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch emails: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 
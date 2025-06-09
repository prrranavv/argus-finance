import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://argus-finance.vercel.app/api/gmail/test'
    : 'http://localhost:3000/api/gmail/test'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const attachmentId = searchParams.get('attachmentId');
    const filename = searchParams.get('filename');

    if (!messageId || !attachmentId || !filename) {
      return NextResponse.json(
        { error: 'Missing required parameters: messageId, attachmentId, filename' },
        { status: 400 }
      );
    }

    // Check if we have the required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Missing Google API credentials' },
        { status: 500 }
      );
    }

    if (!process.env.GMAIL_ACCESS_TOKEN || !process.env.GMAIL_REFRESH_TOKEN) {
      return NextResponse.json(
        { error: 'Gmail authentication required' },
        { status: 401 }
      );
    }

    // Set credentials with refresh token
    oauth2Client.setCredentials({
      access_token: process.env.GMAIL_ACCESS_TOKEN,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log(`📎 Downloading attachment: ${filename} from message: ${messageId}`);

    // Get the attachment
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });

    if (!attachment.data.data) {
      return NextResponse.json(
        { error: 'Attachment data not found' },
        { status: 404 }
      );
    }

    // Decode the base64 data
    const attachmentData = Buffer.from(attachment.data.data, 'base64');

    // Determine MIME type based on file extension
    const getMimeType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'zip': 'application/zip',
      };
      return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    const mimeType = getMimeType(filename);

    // Return the file as a download
    return new NextResponse(attachmentData, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': attachmentData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Gmail attachment download error:', error);
    
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'Gmail access token expired. Please re-authenticate.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to download attachment: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    const { userId } = authResult;

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('🔑 Gmail Save Email Data API: Processing for user:', userId);

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    const client = supabaseAdmin;
    console.log(`💾 Saving ${emails.length} emails to database for user ${userId}...`);

    let savedEmails = 0;
    let updatedEmails = 0;
    const errors = [];

    for (const email of emails) {
      try {
        console.log(`🔍 Processing email ${email.id} from ${email.from}`);
        
        // Transform account_type from title case to snake_case for database
        const accountTypeMapping: Record<string, string> = {
          'Credit Card': 'credit_card',
          'Bank Account': 'bank_account'
        };

        // Prepare email data (without analysis for now)
        const emailData = {
          gmail_message_id: email.id,
          from_email: email.from,
          subject: email.subject,
          received_date: new Date(email.date).toISOString(),
          attachment_urls: email.attachments || [],
          content: email.cleanedBody || email.fullBody || email.body,
          account_type: email.account_type ? accountTypeMapping[email.account_type] || null : null, // Transform if present
          bank_name: email.bank_name || null,   // Will be updated when transactions are analyzed
          is_relevant: email.is_relevant || false, // Will be updated when transactions are analyzed
          user_id: userId // Add user_id to email
        };

        // Check if email already exists for this user
        const { data: existingEmail } = await client
          .from('emails')
          .select('id')
          .eq('gmail_message_id', email.id)
          .eq('user_id', userId)
          .single();

        let emailRecord;
        
        if (existingEmail) {
          // Update existing email
          const { data: updatedEmail, error: updateError } = await client
            .from('emails')
            .update(emailData)
            .eq('gmail_message_id', email.id)
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) {
            throw new Error(`Failed to update email: ${updateError.message}`);
          }
          
          emailRecord = updatedEmail;
          updatedEmails++;
          console.log(`📧 Updated existing email: ${email.subject.substring(0, 50)}...`);
        } else {
          // Insert new email
          const { data: newEmail, error: insertError } = await client
            .from('emails')
            .insert(emailData)
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to insert email: ${insertError.message}`);
          }
          
          emailRecord = newEmail;
          savedEmails++;
          console.log(`📧 Saved new email: ${email.subject.substring(0, 50)}...`);
        }

        // Email saved successfully - transactions will be handled separately

      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);
        errors.push({
          email_id: email.id,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Email save completed: ${savedEmails} new emails, ${updatedEmails} updated emails`);

    return NextResponse.json({
      success: true,
      message: `Processed ${savedEmails + updatedEmails} emails (${savedEmails} new, ${updatedEmails} updated)`,
      savedEmails,
      updatedEmails,
      totalEmails: savedEmails + updatedEmails,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Email data save error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save email data: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 
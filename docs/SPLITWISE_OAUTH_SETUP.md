# Splitwise OAuth Integration Setup Guide

## 🎯 Overview

This guide will help you set up the complete Splitwise OAuth integration for Argus Finance. The OAuth flow provides a seamless user experience where users can connect their Splitwise account with one click, without needing to manually enter API keys.

## 📋 Prerequisites

- Splitwise account (sign up at [splitwise.com](https://splitwise.com))
- Access to your Supabase database
- Environment variables access

## 🚀 Step-by-Step Setup

### **Step 1: Register Your App with Splitwise**

1. **Go to Splitwise Developer Portal**:
   - Visit: [https://secure.splitwise.com/apps](https://secure.splitwise.com/apps)
   - Log in with your Splitwise account

2. **Create New Application**:
   - Click "Register a new application"
   - Fill in the application details:
     - **Application Name**: `Argus Finance` (or your preferred name)
     - **Description**: `Personal finance management with Splitwise integration`
     - **Homepage URL**: `http://localhost:3000` (for development) or your production domain
     - **Callback URL**: `http://localhost:3000/auth/splitwise/callback`

3. **Get Your Credentials**:
   - After registration, you'll receive:
     - **Consumer Key** (public)
     - **Consumer Secret** (private - keep secure!)

### **Step 2: Configure Environment Variables**

Create a `.env.local` file in your project root with these variables:

```env
# Splitwise OAuth Configuration (Required for OAuth flow)
SPLITWISE_CONSUMER_KEY=your_consumer_key_here
SPLITWISE_CONSUMER_SECRET=your_consumer_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Alternative: Splitwise API Key (if not using OAuth)
SPLITWISE_API_KEY=your_api_key_here

# For production, update the APP_URL:
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**⚠️ Important Security Notes:**
- Never commit the `SPLITWISE_CONSUMER_SECRET` to version control
- The `NEXT_PUBLIC_` prefix makes the consumer key available to the client (this is safe and required)
- The consumer secret stays server-side only
- Add `.env.local` to your `.gitignore` file

### **Step 3: Update Database Schema (If Needed)**

Ensure your `user_integrations` table has the `access_token_secret_encrypted` column:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_integrations' 
AND column_name = 'access_token_secret_encrypted';

-- Add column if it doesn't exist
ALTER TABLE user_integrations 
ADD COLUMN IF NOT EXISTS access_token_secret_encrypted TEXT;
```

### **Step 4: Test the Integration**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the OAuth flow**:
   - Sign up/in to your app
   - Go through onboarding to Step 3 (Integrations)
   - Click "Connect" button for Splitwise
   - You should be redirected to Splitwise authorization page
   - After authorization, you'll be redirected back with success message

## 🔧 How It Works

### **OAuth 1.0a Flow Implementation**

Based on the [Splitwise OAuth documentation](https://blog.splitwise.com/2013/07/15/setting-up-oauth-for-the-splitwise-api/), our implementation follows the standard OAuth 1.0a flow:

1. **Request Token**: `/api/splitwise/request-token`
   - Generates OAuth signature using HMAC-SHA1
   - Requests temporary token from Splitwise
   - Returns authorization URL

2. **User Authorization**: 
   - User redirected to Splitwise
   - User authorizes your app
   - Splitwise redirects back with verifier

3. **Access Token**: `/api/splitwise/access-token`
   - Exchanges request token + verifier for access token
   - Returns permanent access credentials

4. **API Calls**: `/api/splitwise/test`
   - Uses access token to make authenticated requests
   - Validates connection works

### **Security Features**

- **Token Encryption**: All tokens stored encrypted in database
- **Server-Side Secrets**: Consumer secret never exposed to client
- **Signature Validation**: All requests signed with HMAC-SHA1
- **Session Management**: Request tokens stored temporarily in session storage

## 🧪 Testing & Debugging

### **Common Issues & Solutions**

1. **"Splitwise OAuth credentials not configured"**
   - ✅ **Fixed**: This error has been resolved in the latest update
   - Check environment variables are set correctly in `.env.local`
   - Restart development server after adding env vars
   - Ensure `SPLITWISE_CONSUMER_KEY` is set

2. **"Failed to get request token from Splitwise"**
   - Verify consumer key/secret are correct
   - Check callback URL matches registered URL exactly
   - Ensure Splitwise app is active and approved

3. **"Missing request token secret"**
   - Browser session storage was cleared
   - User took too long (tokens expire)
   - Try the OAuth flow again

4. **"Invalid response from Splitwise"**
   - Network connectivity issues
   - Splitwise API temporarily down
   - Check Splitwise status page

### **Debug Mode**

Enable debug logging by checking browser console and server logs:

```javascript
// In browser console, check session storage:
console.log('Request Token:', sessionStorage.getItem('splitwise_request_token'))
console.log('Request Secret:', sessionStorage.getItem('splitwise_request_token_secret'))
```

### **Test OAuth Flow**

```bash
# Test request token endpoint
curl -X POST http://localhost:3000/api/splitwise/request-token \
  -H "Content-Type: application/json" \
  -d '{"callback_url": "http://localhost:3000/auth/splitwise/callback"}'

# Should return:
# {
#   "oauth_token": "...",
#   "oauth_token_secret": "...",
#   "oauth_callback_confirmed": true
# }
```

## 🚀 Production Deployment

### **Environment Variables for Production**

```env
# Production environment variables
SPLITWISE_CONSUMER_KEY=your_consumer_key
SPLITWISE_CONSUMER_SECRET=your_consumer_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Update Splitwise App Settings**

1. Go to [https://secure.splitwise.com/apps](https://secure.splitwise.com/apps)
2. Edit your application
3. Update URLs:
   - **Homepage URL**: `https://yourdomain.com`
   - **Callback URL**: `https://yourdomain.com/auth/splitwise/callback`

## 📊 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/splitwise/request-token` | POST | Get request token & auth URL |
| `/api/splitwise/access-token` | POST | Exchange for access token |
| `/api/splitwise/test` | POST | Test API connection |
| `/auth/splitwise/callback` | GET | Handle OAuth callback |
| `/api/onboarding/integrations` | POST | Save integration to DB |

## 🔐 Security Best Practices

1. **Environment Variables**:
   - Use different credentials for dev/staging/production
   - Rotate secrets periodically
   - Monitor for credential leaks

2. **Token Management**:
   - Tokens are encrypted before database storage
   - Implement token refresh if needed
   - Clean up expired tokens

3. **Error Handling**:
   - Don't expose internal errors to users
   - Log security events
   - Implement rate limiting

## 🎉 Success!

Once configured, users will see:
- ✅ One-click Splitwise connection in onboarding
- ✅ Seamless OAuth flow without manual API keys
- ✅ Secure token storage and management
- ✅ Automatic connection testing and validation
- ✅ Fallback to API key method if OAuth is not configured

The integration will automatically sync Splitwise data and enhance the user's financial tracking experience!

## 📞 Support

If you encounter issues:
1. Check the [Splitwise API documentation](https://dev.splitwise.com/)
2. Review the [OAuth 1.0a specification](https://tools.ietf.org/html/rfc5849)
3. Check server logs for detailed error messages
4. Verify all environment variables are correctly set
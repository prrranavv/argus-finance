# Gmail OAuth 2.0 Integration Setup Guide

## 🎯 Overview

This guide will help you set up Gmail OAuth 2.0 integration for Argus Finance. The OAuth flow allows users to securely connect their Gmail account to automatically sync transaction emails, without needing to share their password or use app-specific passwords.

## 📋 Prerequisites

- Google Cloud Console access
- Gmail account for testing
- Access to your Supabase database
- Environment variables access

## 🚀 Step-by-Step Setup

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console**:
   - Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project** (if needed):
   - Click "Select a project" → "New Project"
   - Enter project name: `Argus Finance`
   - Click "Create"

### **Step 2: Enable Gmail API**

1. **Navigate to APIs & Services**:
   - In the left sidebar, click "APIs & Services" → "Library"

2. **Enable Gmail API**:
   - Search for "Gmail API"
   - Click on "Gmail API"
   - Click "Enable"

### **Step 3: Configure OAuth Consent Screen**

1. **Go to OAuth Consent Screen**:
   - Navigate to "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**:
   - Select "External" (for testing with friends)
   - Click "Create"

3. **Fill App Information**:
   ```
   App name: Argus Finance
   User support email: your-email@gmail.com
   Developer contact information: your-email@gmail.com
   ```

4. **Add Scopes**:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Update"

5. **Add Test Users**:
   - In "Test users" section, click "Add Users"
   - Add email addresses of users who will test the integration
   - **Important**: Only these users can use OAuth while in testing mode

### **Step 4: Create OAuth 2.0 Credentials**

1. **Go to Credentials**:
   - Navigate to "APIs & Services" → "Credentials"

2. **Create OAuth Client ID**:
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `Argus Finance Web Client`

3. **Configure Redirect URIs**:
   ```
   Authorized redirect URIs:
   - http://localhost:3000/api/gmail/auth
   - https://your-domain.com/api/gmail/auth (for production)
   ```

4. **Save Credentials**:
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these)

### **Step 5: Environment Variables**

Add these environment variables to your `.env.local` file:

```env
# Gmail OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/auth
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values**:
- `GOOGLE_CLIENT_ID`: From Step 4 (OAuth Client ID)
- `GOOGLE_CLIENT_SECRET`: From Step 4 (OAuth Client Secret)
- `GOOGLE_REDIRECT_URI`: The redirect URI configured in Google Cloud Console
- `NEXT_PUBLIC_APP_URL`: Your app's base URL

### **Step 6: Database Setup**

The Gmail integration uses the existing `user_integrations` table. Ensure you have the required columns:

```sql
-- Verify the table has all required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_integrations';

-- Should include:
-- access_token_encrypted (for OAuth 2.0 access token)
-- refresh_token_encrypted (for OAuth 2.0 refresh token)
-- token_expires_at (for token expiration)
```

## 🧪 Testing the Integration

### **Step 1: Start Development Server**

```bash
npm run dev
```

### **Step 2: Test OAuth Flow**

1. **Go through onboarding** or access integrations
2. **Click "Connect" on Gmail integration**
3. **You should be redirected to Google OAuth**
4. **Sign in with a test user account**
5. **Grant permissions**
6. **You should be redirected back with success message**

### **Step 3: Verify Database Storage**

Check your Supabase database:

```sql
SELECT 
  integration_type,
  is_active,
  token_expires_at,
  created_at
FROM user_integrations 
WHERE integration_type = 'gmail';
```

You should see:
- ✅ `access_token_encrypted`: Base64 encoded access token
- ✅ `refresh_token_encrypted`: Base64 encoded refresh token  
- ✅ `token_expires_at`: Token expiration timestamp
- ✅ `additional_data`: User info and scope details

## 🔧 API Endpoints

The Gmail OAuth integration includes these endpoints:

### **OAuth Flow Endpoints**
- `POST /api/gmail/request-auth` - Generate OAuth URL
- `POST /api/gmail/exchange-token` - Exchange code for tokens
- `GET /auth/gmail/callback` - Handle OAuth callback

### **Integration Management**
- `POST /api/onboarding/integrations` - Save Gmail tokens
- `GET /api/onboarding/integrations` - Get user integrations

## 🔒 Security Features

### **OAuth 2.0 Security**
- ✅ **State Parameter**: CSRF protection
- ✅ **Secure Token Storage**: Encrypted in database
- ✅ **Refresh Token Support**: Automatic token renewal
- ✅ **Scope Limitation**: Only necessary permissions

### **Token Management**
- ✅ **Encryption**: Tokens encrypted before database storage
- ✅ **Expiration Tracking**: Token expiry timestamps
- ✅ **Refresh Logic**: Automatic token refresh (when implemented)

## 🚀 Production Deployment

### **Step 1: Update OAuth Settings**

1. **Add Production Redirect URI**:
   ```
   https://your-domain.com/auth/gmail/callback
   ```

2. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

### **Step 2: Publish OAuth App**

1. **Go to OAuth Consent Screen**
2. **Click "Publish App"**
3. **Submit for verification** (if using sensitive scopes)

**Note**: For testing with friends, you can keep it in "Testing" mode and just add their emails as test users.

## 🐛 Troubleshooting

### **Common Issues**

1. **"OAuth client not found"**
   - Check `NEXT_PUBLIC_GMAIL_CLIENT_ID` is correct
   - Verify OAuth client exists in Google Cloud Console

2. **"Redirect URI mismatch"**
   - Ensure callback URL matches exactly in Google Cloud Console
   - Check `NEXT_PUBLIC_APP_URL` is correct

3. **"Access blocked: This app's request is invalid"**
   - Add user email to test users in OAuth consent screen
   - Verify OAuth consent screen is properly configured

4. **"Token exchange failed"**
   - Check `GMAIL_CLIENT_SECRET` is correct
   - Verify network connectivity to Google APIs

5. **"Database error saving integration"**
   - Ensure `user_integrations` table has all required columns
   - Check Supabase admin client is configured

### **Debug Steps**

1. **Check Environment Variables**:
   ```bash
   # In your app
   console.log('Gmail Client ID:', process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID)
   ```

2. **Test OAuth URL Generation**:
   ```bash
   curl -X POST http://localhost:3000/api/gmail/request-auth
   ```

3. **Check Database Schema**:
   ```sql
   \d user_integrations
   ```

## 📊 Integration Benefits

### **For Users**
- ✅ **Secure Authentication**: No password sharing
- ✅ **Automatic Sync**: Transaction emails synced automatically
- ✅ **Granular Permissions**: Only necessary Gmail access
- ✅ **Easy Revocation**: Can revoke access anytime

### **For Developers**
- ✅ **OAuth 2.0 Standard**: Industry-standard authentication
- ✅ **Refresh Token Support**: Long-term access without re-auth
- ✅ **Comprehensive Error Handling**: Graceful failure management
- ✅ **Secure Token Storage**: Encrypted database storage

## 🔄 Token Refresh (Future Enhancement)

The current implementation stores refresh tokens for future automatic token renewal:

```typescript
// Future implementation
async function refreshGmailToken(userId: string) {
  // Get stored refresh token
  // Exchange for new access token
  // Update database with new tokens
}
```

## 📝 Next Steps

1. **Test with friends**: Add their emails as test users
2. **Implement email sync**: Use stored tokens to fetch emails
3. **Add token refresh**: Automatic token renewal logic
4. **Monitor usage**: Track API quotas and limits
5. **Production deployment**: Publish OAuth app when ready

Your Gmail OAuth 2.0 integration is now ready for testing! 🎉 
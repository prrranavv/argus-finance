# Onboarding System Setup Guide

## Overview

The Argus Finance onboarding system provides a smooth, non-mandatory user experience that collects essential information to personalize the finance dashboard. **User names are now collected during onboarding rather than signup**, creating a cleaner signup flow.

## Features

### ✅ **Implemented Features**

1. **Non-Mandatory Onboarding**: Users can skip onboarding and access the app immediately
2. **Progressive Steps**: 3-step process with visual progress indicators
3. **Modern UI**: Card-based design matching the app's aesthetic
4. **Account Management**: Visual bank/credit card containers with easy add/remove
5. **Splitwise Integration**: Both OAuth and API key options with automatic fallback
6. **Smart Persistence**: Remember user progress and allow resuming later
7. **Dual Name Storage**: Names are stored in both the `users` table and Supabase auth metadata

### 🎨 **Design Improvements**

- **Light & Breezy**: Replaced long forms with interactive cards
- **Visual Account Cards**: Bank/credit card containers with gradients and icons
- **Progress Dots**: Simple dot indicators instead of numbered steps
- **Contextual Icons**: Step-specific icons and colors
- **Skip Options**: Multiple exit points for user flexibility
- **Cleaner Signup**: Removed name field from signup form

## Step-by-Step Flow

### **Step 1: Personal Information**
- **Full name collection** (moved from signup form)
- Privacy mode toggle (hide amounts by default)
- Smart notifications preference
- Clean, centered form design

### **Step 2: Financial Accounts**
- Visual account type selection (Bank vs Credit Card)
- Bank selection dropdown with major Indian banks
- Account number input (last 4 digits)
- Primary account designation
- Beautiful account cards with gradients and hover effects

### **Step 3: Integrations**
- **Splitwise**: OAuth flow + API key fallback (automatically detects configuration)
- **Gmail**: Coming soon placeholder
- Connection status indicators
- Optional integration approach

## Recent Updates

### **🔧 Signup Form Simplification**
- **Removed**: Full name field from signup form
- **Moved**: Name collection to Step 1 of onboarding
- **Benefit**: Faster signup process, better user flow
- **Fallback**: Users who skip onboarding can still use the app

### **🔧 Splitwise OAuth Improvements**
- **Fixed**: "OAuth credentials not configured" error
- **Added**: Automatic fallback to API key method
- **Improved**: Error handling and user feedback
- **Enhanced**: Setup documentation and troubleshooting

## Splitwise OAuth Integration

### **Setup Instructions**

1. **Register Your App with Splitwise**:
   - Go to [Splitwise Apps](https://secure.splitwise.com/apps)
   - Create a new application
   - Set callback URL: `http://localhost:3000/auth/splitwise/callback`

2. **Configure Environment Variables**:
   ```env
   # Required for OAuth flow
   NEXT_PUBLIC_SPLITWISE_CONSUMER_KEY=your_consumer_key
   SPLITWISE_CONSUMER_SECRET=your_consumer_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Alternative: API key method
   SPLITWISE_API_KEY=your_api_key
   ```

3. **Automatic Fallback**:
   - If OAuth is not configured, users see "OAuth setup required. Please use API key for now."
   - Seamless fallback to manual API key entry
   - No disruption to user experience

### **User Experience**

**With OAuth Configured**:
- User clicks "Connect" button
- Redirected to Splitwise for authorization
- Returns with success message
- Integration saved automatically

**Without OAuth Configured**:
- User clicks "Connect" button
- Sees helpful message about OAuth setup
- Can use "API Key" button as alternative
- Manual API key entry with validation

## Database Schema

### **Required Tables**

1. **user_onboarding**: Tracks onboarding progress
2. **user_accounts**: Stores financial account information
3. **user_integrations**: Stores integration credentials (encrypted)

### **Key Fields**

```sql
-- user_onboarding table
current_step VARCHAR -- 'personal_info', 'accounts', 'integrations'
personal_info_completed BOOLEAN
accounts_completed BOOLEAN
integrations_completed BOOLEAN
is_completed BOOLEAN

-- user_integrations table
integration_type VARCHAR -- 'splitwise', 'gmail'
access_token_encrypted TEXT
access_token_secret_encrypted TEXT -- For OAuth 1.0a (Splitwise)
```

## API Endpoints

### **Onboarding Endpoints**
- `GET /api/onboarding/status` - Get user's onboarding progress
- `POST /api/onboarding/update-step` - Update step completion
- `POST /api/onboarding/accounts` - Add financial account
- `POST /api/onboarding/integrations` - Save integration

### **Splitwise OAuth Endpoints**
- `POST /api/splitwise/request-token` - Get OAuth request token
- `POST /api/splitwise/access-token` - Exchange for access token
- `POST /api/splitwise/test` - Test API connection
- `GET /auth/splitwise/callback` - Handle OAuth callback

## User Flow Examples

### **New User Journey**

1. **Signup**: Email + Password only (name removed)
2. **Email Verification**: Standard Supabase flow
3. **Onboarding Modal**: Appears automatically
   - Step 1: Enter name + preferences
   - Step 2: Add bank accounts (optional)
   - Step 3: Connect integrations (optional)
4. **Skip Option**: Available at any step
5. **Dashboard Access**: Immediate, regardless of completion

### **Returning User**

1. **Sign In**: Email + Password
2. **Onboarding Check**: Shows modal if not completed and not skipped
3. **Dashboard**: Direct access if onboarding completed or skipped

## Technical Implementation

### **State Management**
- React hooks for form state
- Supabase for persistence
- Session storage for OAuth tokens
- Local state for UI interactions

### **Error Handling**
- Graceful fallbacks for API failures
- User-friendly error messages
- Automatic retry mechanisms
- Comprehensive logging

### **Security**
- Token encryption before database storage
- Server-side OAuth secret handling
- Input validation and sanitization
- CSRF protection for OAuth flows

## Benefits Achieved

### **User Experience**
- ✅ Faster signup process (no name field)
- ✅ Progressive information collection
- ✅ Non-blocking onboarding flow
- ✅ Multiple skip options
- ✅ Visual feedback and progress tracking

### **Developer Experience**
- ✅ Modular component architecture
- ✅ Comprehensive error handling
- ✅ Detailed documentation
- ✅ Easy environment configuration
- ✅ Automatic fallback mechanisms

### **Business Value**
- ✅ Higher signup conversion (simpler form)
- ✅ Better data collection (contextual)
- ✅ Improved user engagement
- ✅ Flexible integration options
- ✅ Scalable architecture

## Troubleshooting

### **Common Issues**

1. **Onboarding not showing**:
   - Check user authentication status
   - Verify onboarding tables exist
   - Check API endpoint responses

2. **Splitwise OAuth errors**:
   - Verify environment variables
   - Check callback URL configuration
   - Test API endpoints individually

3. **Database errors**:
   - Ensure all tables are created
   - Check RLS policies
   - Verify user permissions

### **Debug Tools**

- Browser console for client-side errors
- Server logs for API issues
- Supabase dashboard for database queries
- Network tab for API request/response inspection

## Future Enhancements

### **Planned Features**
- Gmail OAuth integration
- Additional bank integrations
- Advanced privacy controls
- Onboarding analytics
- A/B testing framework

### **Technical Improvements**
- Enhanced error recovery
- Offline support
- Progressive web app features
- Advanced caching strategies
- Performance optimizations

The onboarding system now provides a seamless, user-friendly experience that balances data collection with user autonomy, while maintaining technical excellence and security best practices. 
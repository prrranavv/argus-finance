# 🔐 Authentication Setup Guide

This guide covers the setup and migration from the old password-based authentication to the new Supabase-based multi-user system.

## 📋 Overview

The authentication system has been upgraded to support:
- **Multi-user support** with proper data isolation
- **Supabase Authentication** with email/password
- **Row Level Security (RLS)** for data protection
- **User profiles** with preferences
- **Invitation system** (placeholder for future implementation)

## 🗄️ Database Setup

### Step 1: Run User Management Schema
Execute the SQL script to create user tables and add user_id columns:

```bash
# In your Supabase SQL Editor or via psql
psql -h your-db-host -U postgres -d your-db-name -f scripts/setup-supabase-users.sql
```

### Step 2: Enable Supabase Authentication
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Settings
3. Ensure these settings:
   - **Enable email confirmations**: ON
   - **Enable email sign-ups**: ON
   - **Site URL**: `http://localhost:3000` (dev) / `https://yourdomain.com` (prod)
   - **Redirect URLs**: Add your domain URLs

### Step 3: Configure Environment Variables
Update your `.env.local` file:

```bash
# Existing Supabase config (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Remove these old auth variables (no longer needed)
# AUTH_REQUIRED=true
# AUTH_PASSWORD=your_old_password
```

## 👤 Admin Account Setup

### Step 1: Create Your Admin Account
1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign up" and create an account with:
   - **Email**: `pranavgfinances@gmail.com`
   - **Password**: Your new secure password
   - **Full Name**: Your name

### Step 2: Verify Your Email
1. Check your email for the confirmation link
2. Click the link to verify your account
3. You'll be redirected back to the app and automatically signed in

### Step 3: Migrate Existing Data
After creating your admin account, run the migration script:

```bash
# In your Supabase SQL Editor
# This will assign all existing transactions, statements, etc. to your account
psql -h your-db-host -U postgres -d your-db-name -f scripts/migrate-existing-data.sql
```

## 🚀 Testing the New System

### Authentication Flow
1. **Sign Up**: New users can create accounts with email verification
2. **Sign In**: Existing users sign in with email/password
3. **Data Isolation**: Each user only sees their own data
4. **Sign Out**: Users can sign out and data remains secure

### Verification Steps
1. Create a test account with a different email
2. Verify you can't see the admin user's data
3. Upload a test statement as the new user
4. Confirm data isolation is working

## 🔧 Technical Details

### New Components
- `AuthProvider`: Manages authentication state
- `SignInForm`: Email/password sign-in
- `SignUpForm`: User registration with email verification
- `AuthWrapper`: Protects the entire app

### Database Changes
- `users` table: User profiles and preferences
- `user_id` column: Added to all existing tables
- **RLS policies**: Ensure data isolation
- **Triggers**: Auto-create user profiles

### API Changes
- Removed old `/api/auth/*` routes
- All existing APIs will automatically filter by authenticated user
- No breaking changes to existing functionality

## 🔒 Security Features

### Row Level Security (RLS)
- **Automatic filtering**: Users only see their own data
- **Insert protection**: Users can only create data for themselves
- **Update/Delete protection**: Users can only modify their own data

### Authentication Security
- **JWT tokens**: Secure session management
- **Email verification**: Prevents unauthorized signups
- **Password requirements**: Minimum 6 characters
- **Secure cookies**: HttpOnly, Secure, SameSite

## 🛠️ Development Notes

### Adding Friends (Future)
The `inviteFriend` function is a placeholder. Future implementation will:
1. Generate invitation tokens
2. Send email invitations
3. Auto-link accounts when friends sign up

### User Preferences
Each user has a `preferences` JSON field for:
- Privacy mode settings
- Theme preferences
- Notification settings

### Error Handling
- Clear error messages for auth failures
- Loading states during authentication
- Proper fallbacks for network issues

## 🐛 Troubleshooting

### "Auth user not found" Error
- Ensure you've created an account via the UI first
- Check the `auth.users` table in Supabase
- Verify the email matches in the migration script

### RLS Policy Issues
- Check that user_id is properly set on all records
- Verify RLS policies are enabled on all tables
- Test with different user accounts

### Email Verification Issues
- Check your Supabase email settings
- Verify SMTP configuration (if using custom SMTP)
- Check spam folder for verification emails

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Test with a fresh database/clean slate
4. Review the migration logs in Supabase

---

**🎉 Congratulations!** Your app now supports multiple users with proper authentication and data isolation. 
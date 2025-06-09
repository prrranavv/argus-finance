# Deployment Instructions

## 🚀 Vercel Deployment with Authentication

### Environment Variables Setup

To deploy Argus Finance with password protection on Vercel, set these environment variables in your Vercel dashboard:

#### Required Environment Variables:

```env
# Authentication Settings
AUTH_REQUIRED=true
AUTH_PASSWORD=your_secure_password_here

# Application Settings  
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# Other existing variables...
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
SPLITWISE_CONSUMER_KEY=your_splitwise_consumer_key
SPLITWISE_CONSUMER_SECRET=your_splitwise_consumer_secret
SPLITWISE_API_KEY=your_splitwise_api_key
```

### 🔧 How to Set Up:

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Add Authentication Variables**:
   - `AUTH_REQUIRED` = `true`
   - `AUTH_PASSWORD` = Choose a strong password

3. **Deploy**
   - Your app will now require password authentication in production
   - Local development remains password-free (AUTH_REQUIRED=false)

### 🔐 Security Notes:

- **Choose a strong password** for AUTH_PASSWORD
- The password is stored as a server-side environment variable
- Authentication cookie expires after 24 hours
- All authentication is handled server-side for security

### 🌍 Environment Behavior:

| Environment | AUTH_REQUIRED | Password Required |
|-------------|---------------|-------------------|
| **Local** | `false` | ❌ No |
| **Vercel** | `true` | ✅ Yes |

### 🎯 Benefits:

- **Development**: No password needed locally
- **Production**: Public deployment is protected
- **Simple**: Single password authentication
- **Secure**: Server-side validation with httpOnly cookies
- **Flexible**: Can easily toggle on/off per environment

Perfect for personal finance apps that need public hosting but private access! 🏦 
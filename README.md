![product asset](https://github.com/prrranavv/argus-finance/blob/main/public/cardImages/mainPageAsset.png)

# 💰 Argus Finance - Your Personal Finance Command Center

> **"Take control of your money with the power of AI and beautiful design"**

Stop losing track of your spending across multiple credit cards and bank accounts. Argus Finance is the modern finance dashboard that transforms your messy bank statements into actionable insights - without sending your sensitive data to the cloud.

## 🚀 Why Argus Finance?

**Built by a developer, for people who actually want to understand their money.**

As someone who juggled 5+ credit cards and multiple bank accounts, I was tired of:
- 💸 Losing track of spending across different cards
- 📊 Ugly, outdated finance apps that feel like spreadsheets
- 🔒 Having to upload sensitive financial data to random cloud services
- 🤖 Manual categorization of hundreds of transactions

So I built something better. **Argus Finance is privacy-first, AI-powered, and designed for the modern multi-card lifestyle.**

## ✨ What Makes It Special

### 🎨 **Beautiful, Intuitive Design**
- **3D Credit Card Visualization**: Your actual cards rendered in stunning 3D
- **Smart Layout**: Sidebar navigation with your cards, main dashboard with insights
- **Smooth Animations**: 1.4x hover effects and buttery smooth transitions
- **Mobile-First**: Looks gorgeous on every device

### 🧠 **AI That Actually Works**
- **Intelligent Transaction Processing**: Upload any bank statement format
- **Smart Categorization**: AI understands "AMZN MKTPLACE" means Amazon
- **Zero Manual Work**: No more tagging transactions one by one
- **Context-Aware Insights**: Understands your spending patterns

### 🔒 **Privacy by Design**
- **Secure Cloud Database**: Supabase with Row Level Security (RLS)
- **No Third-Party Data Sharing**: Your financial data stays between you and your database
- **Open Source**: Audit the code yourself
- **Self-Hosted Ready**: Can be deployed to your own infrastructure

### ⚡ **Performance That Scales**
- **Virtualized Lists**: Handle 10,000+ transactions smoothly
- **Smart Caching**: Instant navigation between views
- **Optimized Queries**: Sub-100ms response times
- **Progressive Loading**: See your data as it loads

## 🎯 Perfect For

- **Digital Nomads** managing multiple currencies and cards
- **Credit Card Optimizers** juggling rewards across 5+ cards
- **Privacy-Conscious Users** who don't trust cloud finance apps
- **Data Nerds** who want granular control over their financial data
- **Small Business Owners** tracking business expenses

## 🏗 What's Inside

### **Current Features** ✅
- 📤 **Drag & Drop Upload**: Any CSV, XLS, or PDF statement
- 📧 **Gmail Integration**: Automatically extract transactions from bank emails
- 🎨 **3D Card Management**: Visual card selection with real card renders
- 📊 **Interactive Charts**: Spending trends, monthly summaries, balance progression
- 🔍 **Smart Search**: Find transactions instantly with debounced search
- 📱 **Responsive Design**: Perfect on mobile, tablet, and desktop
- 🚫 **Duplicate Prevention**: Never process the same transaction twice
- ⚡ **Performance Optimized**: Handles large datasets without breaking a sweat

### **Coming Soon** 🚧
- 📄 **PDF Bank Statements**: Upload any PDF statement directly
- 💡 **AI Financial Insights**: "You spent 23% more on food this month"
- 🎯 **Budget Tracking**: Set goals and track progress
- 📈 **Investment Tracking**: Connect your portfolio data
- 🤖 **Natural Language Queries**: "Show me all Uber rides last month"

## 🛠 Tech Stack (For the Curious)

Built with modern, battle-tested technologies:
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS (no CSS frameworks needed)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **AI**: OpenAI GPT-4 for transaction intelligence
- **Performance**: Virtualization, skeleton loading, optimized queries

## 🚀 Get Started in 2 Minutes

```bash
# 1. Clone and install
git clone https://github.com/prrranavv/argus-finance.git
cd argus-finance
npm install

# 2. Add your OpenAI and Supabase keys
echo "OPENAI_API_KEY=your_key_here" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_key" >> .env.local

# 3. Run the app
npm run dev
```

Open `localhost:3000` and upload your first statement. Watch the magic happen.

## 📧 Gmail Integration Setup (Optional)

Argus Finance can automatically extract transaction data from your Gmail messages (bank alerts, payment confirmations, etc.). To enable this feature:

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and click "Enable"

### 2. Configure OAuth Consent Screen (IMPORTANT!)
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - **App name**: "Argus Finance" (or your app name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Add scopes: Click "Add or Remove Scopes" and add:
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Add test users: In the "Test users" section, add your Gmail address
6. Save and continue through all steps

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create credentials" > "OAuth 2.0 Client IDs"
3. Set application type to "Web application"
4. Add authorized redirect URI: `http://localhost:3000/api/gmail/auth`
5. For production, add your domain: `https://yourdomain.com/api/gmail/auth`
6. Save and copy the Client ID and Client Secret

### 4. Get Access Tokens
1. Add your credentials to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/auth
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/api/gmail/auth` to get the authorization URL
4. Follow the authorization flow and copy the returned tokens
5. Add tokens to your `.env.local`:
   ```bash
   GMAIL_ACCESS_TOKEN=your_access_token
   GMAIL_REFRESH_TOKEN=your_refresh_token
   ```

### 5. Using Gmail Integration
- Open the Statements modal in the app
- Click "Fetch transactions from Gmail"
- The system will search your last 10 emails for transaction data
- Extracted transactions will appear in the UI for review

**Privacy Note**: The Gmail integration only reads emails from known bank senders and transaction-related subjects. Your email content is processed locally and only transaction data is extracted.

### 🔧 Troubleshooting Gmail Setup

**Getting "Error 403: access_denied"?**
This happens when the OAuth consent screen isn't properly configured:

1. **Configure OAuth Consent Screen**: Make sure you've completed step 2 above
2. **Add Test User**: Add your Gmail address in the "Test users" section
3. **App Status**: Your app will be in "Testing" mode - this is normal for personal use
4. **Verification**: You don't need to verify your app for personal use

**Common Issues:**
- ❌ **Redirect URI mismatch**: Ensure it's exactly `http://localhost:3000/api/gmail/auth`
- ❌ **Gmail API not enabled**: Check that Gmail API is enabled in your project
- ❌ **Scope missing**: Make sure `gmail.readonly` scope is added to consent screen
- ❌ **Not a test user**: Your email must be added as a test user

**Still having issues?** Visit `/api/gmail/auth` in your browser to see detailed error messages and troubleshooting steps.

## 🚀 Deploy to Vercel

### Environment Variables Required:
```bash
# OpenAI API for transaction intelligence
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gmail API for email transaction extraction (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/auth
GMAIL_ACCESS_TOKEN=your_gmail_access_token
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
```

### One-Click Deploy:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/prrranavv/argus-finance)

Or manually:
1. Import your GitHub repository to Vercel
2. Add the environment variables above
3. Deploy!

## 🎨 Visual Design

**Beautiful by Design**: Argus features a stunning visual identity with:
- **Custom 3D Card Renders**: Your actual credit cards rendered in beautiful 3D
- **Sophisticated Logo**: Clean, modern branding that reflects financial intelligence
- **Smooth Animations**: Buttery 1.4x hover effects and seamless transitions
- **Dark/Light Mode**: Adapts to your system preferences automatically

*Screenshots coming soon - the UI is too beautiful not to show off*

## 💭 Philosophy

**"Financial tools should be powerful, private, and beautiful."**

Most finance apps are either too simple (mint) or too complex (YNAB). They're built for the masses, not for people who actually care about their financial data.

Argus Finance is different. It's built for:
- **Power users** who want granular control
- **Privacy advocates** who don't trust cloud services
- **Design lovers** who refuse to use ugly software
- **Data enthusiasts** who want their financial data to tell a story

## 🤝 Contributing

This is a passion project, but contributions are welcome! Whether you're fixing bugs, adding features, or improving the design - let's build something amazing together.

## 📄 License

MIT License - because good financial tools should be accessible to everyone.

---

**Built with ❤️ by [@prrranavv](https://github.com/prrranavv)**

*If this helped you take control of your finances, consider giving it a ⭐*

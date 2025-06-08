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
- **Local-First**: Your data never leaves your device
- **SQLite Database**: Everything stored locally and encrypted
- **No Cloud Dependencies**: Works offline, always secure
- **Open Source**: Audit the code yourself

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
- **Database**: Prisma + SQLite (local-first architecture)
- **AI**: OpenAI GPT-4 for transaction intelligence
- **Performance**: Virtualization, skeleton loading, optimized queries

## 🚀 Get Started in 2 Minutes

```bash
# 1. Clone and install
git clone https://github.com/prrranavv/argus-finance.git
cd argus-finance
npm install

# 2. Add your OpenAI key (for AI categorization)
echo "OPENAI_API_KEY=your_key_here" > .env.local

# 3. Setup database and run
npx prisma generate && npx prisma db push
npm run dev
```

Open `localhost:3000` and upload your first statement. Watch the magic happen.

## 🎨 Screenshots

*Coming soon - the UI is too beautiful not to show off*

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

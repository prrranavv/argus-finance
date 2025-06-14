# Financial Chat Agent - Complete Setup Guide

This implementation creates a comprehensive financial chat interface with 6 powerful tools powered by OpenAI function calling.

## Features

### Banking Tools
1. **Monthly Expense Analysis** - Get detailed monthly expense and balance data, filterable by bank (HDFC, Axis, or Total)
2. **Transaction Search** - Search through transactions by description, amount, category, bank, and time range
3. **Spending Analysis** - Get spending breakdown by categories, top expenses, and recurring payments

### Splitwise Tools
4. **Splitwise Expenses** - Get shared expenses and bills with filtering by group, date range, and limits
5. **Splitwise Friends** - View friends list and current balances with each person
6. **Splitwise User Info** - Get current user information and overall Splitwise balances

## How It Works

- **Smart Function Calling**: OpenAI automatically selects the appropriate tools based on user queries
- **Multi-Tool Support**: Can execute multiple tools simultaneously (e.g., "Show HDFC expenses and top spending categories")
- **Real-Time Streaming**: Uses Server-Sent Events for typewriter-effect responses
- **Error Handling**: Graceful error handling with user-friendly messages
- **Privacy Integration**: Respects existing privacy mode settings

## API Endpoints

- `/api/chat/stream` - Main streaming chat endpoint with function calling
- Uses existing APIs:
  - `/api/monthly-summary-v2` - Monthly expense data
  - `/api/all-transactions` - Transaction search
  - `/api/transaction-metrics` - Spending analysis
  - `/api/splitwise/expenses` - Splitwise expenses
  - `/api/splitwise/friends` - Splitwise friends
  - `/api/splitwise/current-user` - Splitwise user info

## Example Queries

### Banking
- "What were my expenses last month on HDFC?"
- "Find all Amazon purchases in the last 30 days"
- "Show my top spending categories for the last 60 days"
- "Tell me about my last 3 months expenses (Feb-May) on HDFC account and what has been the top spending categories"

### Splitwise
- "Show me my recent Splitwise expenses"
- "Who do I owe money to on Splitwise?"
- "What are my shared expenses from last month?"
- "Show me all expenses with [friend name]"

### Complex Multi-Tool Queries
- "Find all restaurant purchases and analyze my food spending category"
- "Show HDFC monthly expenses and search for any large transactions over $500"
- "Get my Splitwise balances and recent shared expenses"

## Environment Variables Required

```bash
OPENAI_API_KEY=your_openai_api_key
SPLITWISE_API_KEY=your_splitwise_api_key  # For Splitwise features
```

## Technical Implementation

### Key Fixes in This Version
1. **Multi-Tool Calling**: Fixed tool call accumulation by using `findIndex` with `tool_call_id` instead of array indices
2. **Parallel Execution**: Tool calls now execute in parallel using `Promise.all()` for better performance
3. **Better Error Handling**: Each tool call is wrapped in try-catch with specific error messages
4. **Streaming Improvements**: More robust streaming with proper cleanup and error states

### Architecture
- Frontend: Next.js with streaming chat UI
- Backend: OpenAI API with function calling
- Data Sources: Existing transaction APIs + Splitwise APIs
- Deployment: Vercel-ready (no additional services needed)

## Deployment

1. Ensure all environment variables are set in Vercel
2. The app uses existing OpenAI dependency (no additional packages needed)
3. All APIs proxy to existing backend endpoints
4. Deploy as normal Next.js application

## Usage Tips

1. **Natural Language**: Use conversational queries - the AI will understand context
2. **Specific Dates**: You can specify date ranges like "last 3 months" or "February to May"
3. **Bank Filtering**: Mention specific banks (HDFC, Axis) for targeted analysis
4. **Multi-Part Questions**: Ask complex questions that require multiple data sources
5. **Splitwise Groups**: You can ask about specific friend groups or overall balances

The system is now production-ready with comprehensive financial analysis capabilities covering both personal banking and shared expenses through Splitwise. 
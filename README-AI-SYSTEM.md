# Financial Assistant AI System

This document explains the organization and structure of the financial assistant AI system in your application.

## 📁 File Structure

The AI system has been modularized into separate files for better maintainability:

```
src/lib/ai/
├── system-prompt.ts     # System prompt for the AI assistant
├── tools.ts            # OpenAI function calling tools definitions
└── tool-functions.ts   # Implementation of tool functions

src/app/api/chat/stream/route.ts  # Main API endpoint using the AI system
```

## 🎯 System Components

### 1. System Prompt (`src/lib/ai/system-prompt.ts`)

Contains the comprehensive system prompt that defines the AI assistant's behavior:
- **Visual-first approach**: Prioritizes showing data visually rather than just describing it
- **Response patterns**: Defines how different types of queries should be handled
- **Visualization formats**: Specifies exact formats for transaction cards, charts, and Splitwise data
- **Execution rules**: Critical rules the AI must follow

**To modify the AI's behavior:**
1. Edit `FINANCIAL_ASSISTANT_SYSTEM_PROMPT` in this file
2. The changes will automatically apply to all API calls

### 2. Tools Definition (`src/lib/ai/tools.ts`)

Defines the function calling tools available to the AI:
- `get_monthly_expense`: Monthly expense and balance data
- `search_transactions`: Search through transactions
- `get_spending_by_category`: Category-wise spending breakdown
- `get_splitwise_expenses`: Splitwise shared expenses
- `get_splitwise_friends`: Splitwise friends and balances
- `get_splitwise_current_user`: Current user info
- `get_splitwise_groups`: Splitwise groups

**To add new tools:**
1. Add the tool definition to `FINANCIAL_ASSISTANT_TOOLS` array
2. Implement the corresponding function in `tool-functions.ts`
3. Add the function call to the switch statement in `executeToolFunction`

### 3. Tool Functions (`src/lib/ai/tool-functions.ts`)

Contains the actual implementation of all tool functions:
- Individual functions for each tool
- `executeToolFunction`: Dispatcher that routes tool calls to the correct function
- `getBaseUrl`: Helper function for correct URL construction in all environments

**Features:**
- **Environment-aware URL construction**: Works in development, production, and Vercel
- **Error handling**: Graceful error handling with meaningful error messages
- **Parallel execution**: Tools can be executed in parallel for better performance

## 🔧 How to Modify the System

### Adding a New Tool

1. **Define the tool** in `src/lib/ai/tools.ts`:
```typescript
{
  type: "function",
  function: {
    name: "get_investment_data",
    description: "Get user's investment portfolio data",
    parameters: {
      type: "object",
      properties: {
        timeRange: {
          type: "string",
          description: "Time range for investment data",
          enum: ["1month", "3months", "1year"]
        }
      },
      required: []
    }
  }
}
```

2. **Implement the function** in `src/lib/ai/tool-functions.ts`:
```typescript
export async function getInvestmentData(timeRange?: string) {
  try {
    const baseUrl = getBaseUrl();
    const url = new URL('/api/investments', baseUrl);
    if (timeRange) {
      url.searchParams.set('timeRange', timeRange);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch investment data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching investment data:', error);
    return { error: 'Unable to fetch investment data' };
  }
}
```

3. **Add to the dispatcher** in the `executeToolFunction` switch statement:
```typescript
case "get_investment_data":
  result = await getInvestmentData(parsedArgs.timeRange);
  break;
```

### Modifying the System Prompt

Edit `src/lib/ai/system-prompt.ts` to change:
- Response patterns
- Visualization instructions
- Execution rules
- Example responses

### Updating Tool Parameters

Modify the tool definitions in `src/lib/ai/tools.ts` to:
- Add new parameters
- Change parameter descriptions
- Update validation rules (enums, required fields)

## 🚀 Deployment Considerations

### Environment Variables
Ensure these environment variables are set:
- `OPENAI_API_KEY`: Your OpenAI API key
- `VERCEL_URL`: Automatically set by Vercel in production
- `NODE_ENV`: Set to 'development' or 'production'

### URL Construction
The system automatically handles URL construction for:
- Local development (`http://localhost:3000`)
- Vercel production (`https://your-app.vercel.app`)
- Custom hosting environments

## 🐛 Troubleshooting

### Tools Not Working
1. Check OpenAI API key is set correctly
2. Verify internal API endpoints are accessible
3. Check network logs for failed requests
4. Ensure proper environment variable configuration

### Visualization Not Showing
1. Verify the AI is using the correct data formats
2. Check that the frontend parsing logic matches the prompt specifications
3. Ensure chart data structure is correct

### Performance Issues
1. Tool functions execute in parallel by default
2. Consider adding caching for frequently accessed data
3. Monitor API response times

## 📊 Data Formats

The system uses specific data formats for visualizations:

- **Transaction Cards**: `<TRANSACTIONS_DATA>[...]</TRANSACTIONS_DATA>`
- **Charts**: `<CHART_DATA>{...}</CHART_DATA>`
- **Splitwise Friends**: `<SPLITWISE_FRIENDS_DATA>[...]</SPLITWISE_FRIENDS_DATA>`
- **Splitwise Groups**: `<SPLITWISE_GROUPS_DATA>[...]</SPLITWISE_GROUPS_DATA>`
- **Splitwise Activity**: `<SPLITWISE_ACTIVITY_DATA>[...]</SPLITWISE_ACTIVITY_DATA>`

These formats are parsed by the frontend and rendered as interactive components.

## 🔄 Development Workflow

1. **Make changes** to the appropriate file based on what you want to modify
2. **Test locally** using the `/experimental` page
3. **Deploy to Vercel** - changes will be applied automatically
4. **Monitor logs** for any errors or issues

The modular structure makes it easy to maintain and extend the AI system while keeping concerns separated. 
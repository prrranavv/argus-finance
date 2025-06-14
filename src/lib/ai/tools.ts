import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const FINANCIAL_ASSISTANT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_monthly_expense",
      description: "Get monthly expense and balance data for the user. This shows account balances by month and can be filtered by bank.",
      parameters: {
        type: "object",
        properties: {
          bank: {
            type: "string",
            description: "Bank name to filter by (e.g., 'HDFC', 'Axis', or 'Total' for all banks). Leave empty for all banks.",
            enum: ["Total", "HDFC", "Axis"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_transactions",
      description: "Search through the user's transactions by description, amount, or category. Great for finding specific purchases or types of expenses.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query to find in transaction descriptions, amounts, or categories (e.g., 'coffee', 'amazon', '500')"
          },
          bank: {
            type: "string",
            description: "Bank name to filter by",
            enum: ["Total", "HDFC", "Axis"]
          },
          timeRange: {
            type: "string",
            description: "Time range to search within",
            enum: ["7days", "30days", "60days"]
          },
          limit: {
            type: "number",
            description: "Maximum number of transactions to return (default: 10)",
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_spending_by_category",
      description: "Get detailed spending breakdown by categories, including top categories, recurring payments, and spending insights.",
      parameters: {
        type: "object",
        properties: {
          timeRange: {
            type: "string",
            description: "Time period for analysis",
            enum: ["7days", "30days", "60days"]
          },
          bank: {
            type: "string",
            description: "Bank name to filter by",
            enum: ["all", "HDFC", "Axis"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_splitwise_expenses",
      description: "Get Splitwise shared expenses and bills. Can filter by group, date range, and limit results.",
      parameters: {
        type: "object",
        properties: {
          groupId: {
            type: "string",
            description: "Filter expenses by specific group ID"
          },
          limit: {
            type: "number",
            description: "Maximum number of expenses to return (default: 20)",
            default: 20
          },
          dateAfter: {
            type: "string",
            description: "Only show expenses after this date (ISO format, e.g., '2024-01-01T00:00:00Z')"
          },
          dateBefore: {
            type: "string",
            description: "Only show expenses before this date (ISO format)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_splitwise_friends",
      description: "Get list of Splitwise friends and their current balances with you.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_splitwise_current_user",
      description: "Get current Splitwise user information and overall balances.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_splitwise_groups",
      description: "Get list of Splitwise groups and their outstanding balances.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
]; 
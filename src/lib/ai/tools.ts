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
      name: "get_key_metrics",
      description: "Get key financial metrics including total balance, expenses, income, net savings, and bank-wise balances.",
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
      name: "get_balance_progression",
      description: "Get bank account balance progression over time. Shows how balances have changed month by month.",
      parameters: {
        type: "object",
        properties: {
          bank: {
            type: "string",
            description: "Bank name to filter by (e.g., 'HDFC', 'Axis', or 'Total' for all banks)",
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
      name: "get_credit_card_progression",
      description: "Get credit card balance progression over time. Shows how credit card balances have changed month by month.",
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
      name: "get_credit_card_summary",
      description: "Get credit card summary data by card, showing monthly balances and trends.",
      parameters: {
        type: "object",
        properties: {
          card: {
            type: "string",
            description: "Credit card name to filter by (e.g., 'HDFC Diners', 'Flipkart Axis', or 'Total' for all cards)",
            enum: ["Total", "HDFC Diners", "Flipkart Axis"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_bank_names",
      description: "Get list of all available bank names in the user's financial data.",
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
      name: "get_banks_with_types",
      description: "Get list of banks with their associated account types (e.g., Savings, Credit Card, Current).",
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
      name: "get_statements",
      description: "Get list of uploaded bank statements and their processing status.",
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
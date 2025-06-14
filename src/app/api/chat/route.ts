import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get monthly expense data
async function getMonthlyExpense(bank?: string) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const url = new URL('/api/monthly-summary-v2', baseUrl);
    if (bank && bank !== 'Total') {
      url.searchParams.set('bank', bank);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch monthly data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching monthly expense data:', error);
    return { error: 'Unable to fetch expense data' };
  }
}

// Function to search transactions
async function searchTransactions(query?: string, bank?: string, timeRange?: string, limit: number = 10) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const url = new URL('/api/all-transactions', baseUrl);
    if (bank && bank !== 'Total') {
      url.searchParams.set('bank_name', bank);
    }
    if (timeRange) {
      url.searchParams.set('time_range', timeRange);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    let transactions = await response.json();
    
    // Apply search filter if provided
    if (query) {
      const searchLower = query.toLowerCase();
      transactions = transactions.filter((t: any) => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error searching transactions:', error);
    return { error: 'Unable to search transactions' };
  }
}

// Function to get spending by category
async function getSpendingByCategory(timeRange?: string, bank?: string) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const url = new URL('/api/transaction-metrics', baseUrl);
    if (timeRange) {
      url.searchParams.set('timeRange', timeRange);
    }
    if (bank && bank !== 'all') {
      url.searchParams.set('bank', bank);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch spending data');
    }

    const data = await response.json();
    return {
      topCategories: data.breakdown?.topCategories || [],
      totalExpenses: data.metrics?.totalExpenses?.current || 0,
      recurringPayments: data.insights?.recurringPayments || [],
      topExpenses: data.topExpenses || []
    };
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    return { error: 'Unable to fetch spending data' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Define the functions for OpenAI
    const tools = [
      {
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
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
      }
    ];

    // Add system message for financial assistant context
    const systemMessage = {
      role: "system" as const,
      content: "You are a helpful financial assistant. You can help users understand their monthly expenses and account balances. When users ask about their finances, use the get_monthly_expense function to get their actual data and provide insightful analysis. Be conversational and helpful in explaining financial patterns."
    };

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      tools: tools,
      tool_choice: "auto"
    });

    const message = response.choices[0].message;

    // Check if OpenAI wants to call functions
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Process all tool calls
      const toolResults = [];
      
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result;
        
        switch (toolCall.function.name) {
          case "get_monthly_expense":
            result = await getMonthlyExpense(args.bank);
            break;
          case "search_transactions":
            result = await searchTransactions(args.query, args.bank, args.timeRange, args.limit);
            break;
          case "get_spending_by_category":
            result = await getSpendingByCategory(args.timeRange, args.bank);
            break;
          default:
            result = { error: `Unknown function: ${toolCall.function.name}` };
        }
        
        toolResults.push({
          role: "tool" as const,
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        });
      }
      
      // Send all function results back to OpenAI
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          systemMessage,
          ...messages,
          message, // The assistant's message with tool calls
          ...toolResults
        ],
      });

      return NextResponse.json({
        message: followUpResponse.choices[0].message.content
      });
    }

    // If no function call was made, return the direct response
    return NextResponse.json({
      message: message.content
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 
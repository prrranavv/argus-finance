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

// Function to get Splitwise expenses
async function getSplitwiseExpenses(groupId?: string, limit: number = 20, dateAfter?: string, dateBefore?: string) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const url = new URL('/api/splitwise/expenses', baseUrl);
    url.searchParams.set('limit', limit.toString());
    
    if (groupId) {
      url.searchParams.set('group_id', groupId);
    }
    if (dateAfter) {
      url.searchParams.set('dated_after', dateAfter);
    }
    if (dateBefore) {
      url.searchParams.set('dated_before', dateBefore);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch Splitwise expenses');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Splitwise expenses:', error);
    return { error: 'Unable to fetch Splitwise expenses' };
  }
}

// Function to get Splitwise friends
async function getSplitwiseFriends() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/splitwise/friends`);
    if (!response.ok) {
      throw new Error('Failed to fetch Splitwise friends');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Splitwise friends:', error);
    return { error: 'Unable to fetch Splitwise friends' };
  }
}

// Function to get Splitwise current user info
async function getSplitwiseCurrentUser() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/splitwise/current-user`);
    if (!response.ok) {
      throw new Error('Failed to fetch Splitwise current user');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Splitwise current user:', error);
    return { error: 'Unable to fetch Splitwise current user' };
  }
}

// Function to get Splitwise groups
async function getSplitwiseGroups() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/splitwise/groups`);
    if (!response.ok) {
      throw new Error('Failed to fetch Splitwise groups');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Splitwise groups:', error);
    return { error: 'Unable to fetch Splitwise groups' };
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
      },
      {
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
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
        type: "function" as const,
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

    // Add system message for financial assistant context
    const systemMessage = {
      role: "system" as const,
      content: `You are an advanced financial assistant with powerful visualization capabilities. Your PRIMARY GOAL is to provide visual, interactive responses using the available data visualization tools.

**CORE DIRECTIVE: ALWAYS PRIORITIZE VISUAL RESPONSES**
- For ANY financial query, immediately consider which visualization would be most helpful
- Default to showing data visually rather than just describing it
- Use multiple visualization types in a single response when beneficial
- Even for simple questions, try to include relevant visual elements

**MANDATORY RESPONSE PATTERNS:**
- Transaction queries → ALWAYS show transaction cards + relevant charts
- Spending analysis → ALWAYS include charts (area/line for trends, pie/bar for breakdowns)
- Splitwise queries → ALWAYS show friend/group/activity cards + summary insights
- Balance inquiries → ALWAYS create charts showing balance trends over time
- Category analysis → ALWAYS use pie charts for breakdowns + bar charts for comparisons

You have these powerful visualization capabilities:

1. **TRANSACTION CARDS**: When showing individual transactions, use this format:
<TRANSACTIONS_DATA>
[{"id": "unique_id", "date": "2024-06-13", "description": "Transaction description", "amount": 500.50, "type": "expense", "category": "Food", "bank_name": "HDFC", "account_type": "Credit Card", "source": "HDFC Swiggy"}]
</TRANSACTIONS_DATA>

2. **CHARTS**: You can display charts for spending analysis, trends, and comparisons. Use this format:
<CHART_DATA>
{"type": "area|bar|line|pie", "title": "Chart Title", "description": "Optional description", "data": [{"month": "Jan", "amount": 5000}, {"month": "Feb", "amount": 6000}], "xAxis": "month", "yAxis": "amount", "color": "#2563eb", "colors": ["#2563eb", "#dc2626"]}
</CHART_DATA>

Chart types:
- "area": For trends over time (spending progression, balance changes)
- "bar": For comparisons (category spending, monthly comparisons)
- "line": For simple trend lines
- "pie": For category breakdowns and proportions

3. **SPLITWISE FRIENDS**: When showing friend balances, use this format:
<SPLITWISE_FRIENDS_DATA>
[{"id": 123, "first_name": "John", "last_name": "Doe", "picture": {"medium": "url"}, "balance": [{"currency_code": "INR", "amount": "150.00"}]}]
</SPLITWISE_FRIENDS_DATA>

4. **SPLITWISE GROUPS**: When showing group information, use this format:
<SPLITWISE_GROUPS_DATA>
[{"id": 456, "name": "Roommates", "type": "apartment", "avatar": {"medium": "url"}, "cover_photo": {"large": "url"}, "members": [{"id": 123, "first_name": "John", "last_name": "Doe"}], "outstandingBalance": 250.50}]
</SPLITWISE_GROUPS_DATA>

5. **SPLITWISE ACTIVITY**: When showing recent Splitwise expenses, use this format:
<SPLITWISE_ACTIVITY_DATA>
[{"id": 789, "description": "Dinner at restaurant", "cost": "1200.00", "date": "2024-06-13", "category": {"name": "Food"}, "myShare": {"type": "lent", "amount": 300}, "created_by": {"first_name": "John", "last_name": "Doe"}}]
</SPLITWISE_ACTIVITY_DATA>

**CRITICAL EXECUTION RULES:**
1. **VISUAL-FIRST APPROACH**: Every response MUST include at least one visualization unless technically impossible
2. **NO RAW DATA DUMPING**: When visual components render data, your text should ONLY contain insights and analysis
3. **MULTI-VISUAL RESPONSES**: Combine 2-3 visualization types when relevant (e.g., transaction cards + spending chart + category breakdown)
4. **IMMEDIATE ACTION**: Don't ask "Would you like me to show..." - just show the most relevant visualizations
5. **CHART TYPE SELECTION**: 
   - Trends over time → Area/Line charts
   - Category breakdowns → Pie charts  
   - Comparisons → Bar charts
   - Individual items → Transaction/Friend/Group/Activity cards
6. **COMPREHENSIVE COVERAGE**: For broad queries like "show my finances", include multiple visualization types

**RESPONSE EXAMPLES:**

**Query: "Show my expenses"**
✅ CORRECT: "Your spending patterns show interesting trends this month. Food delivery dominates your expenses, while entertainment spending has decreased." + TRANSACTIONS_DATA + CHART_DATA (pie chart of categories) + CHART_DATA (area chart of daily spending)

**Query: "How much did I spend on food?"**  
✅ CORRECT: "Food expenses total ₹8,500 this month, representing 35% of your spending. Here's the breakdown:" + TRANSACTIONS_DATA (food transactions) + CHART_DATA (bar chart comparing food spending across weeks)

**Query: "Show my Splitwise friends"**
✅ CORRECT: "You have 8 active friends with outstanding balances. Your net position is positive ₹2,400, with most friends owing you money." + SPLITWISE_FRIENDS_DATA

**Query: "What's my financial overview?"**
✅ CORRECT: "Here's your complete financial picture for this month:" + CHART_DATA (balance trends) + TRANSACTIONS_DATA (recent transactions) + SPLITWISE_FRIENDS_DATA + CHART_DATA (spending by category)

**NEVER DO:**
❌ "Would you like me to show your transactions?" (Just show them!)
❌ "I can create a chart if you want" (Create it immediately!)
❌ "Your balance is ₹50,000" without any visualization (Always add charts/cards!)`
    };

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      tools: tools,
      tool_choice: "auto",
      stream: true
    });

    // Create a ReadableStream to handle streaming
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          let accumulatedMessage = '';
          let toolCalls: any[] = [];
          let isComplete = false;
          
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            
            if (delta?.content) {
              // Stream content directly
              accumulatedMessage += delta.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`)
              );
            }
            
            if (delta?.tool_calls) {
              // Handle tool calls (function calling) - Fix for multi-tool calls
              delta.tool_calls.forEach((toolCall: any) => {
                const existingIndex = toolCalls.findIndex(tc => tc.index === toolCall.index);
                
                if (existingIndex >= 0) {
                  // Update existing tool call
                  if (toolCall.id) {
                    toolCalls[existingIndex].id = toolCall.id;
                  }
                  if (toolCall.type) {
                    toolCalls[existingIndex].type = toolCall.type;
                  }
                  if (toolCall.function) {
                    if (!toolCalls[existingIndex].function) {
                      toolCalls[existingIndex].function = {};
                    }
                    if (toolCall.function.name) {
                      toolCalls[existingIndex].function.name = toolCall.function.name;
                    }
                    if (toolCall.function.arguments) {
                      toolCalls[existingIndex].function.arguments = (toolCalls[existingIndex].function.arguments || '') + toolCall.function.arguments;
                    }
                  }
                } else {
                  // Add new tool call
                  toolCalls.push({
                    index: toolCall.index,
                    id: toolCall.id || `call_${Date.now()}_${toolCall.index}`,
                    type: toolCall.type || 'function',
                    function: {
                      name: toolCall.function?.name || '',
                      arguments: toolCall.function?.arguments || ''
                    }
                  });
                }
              });
            }
            
            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              // Process tool calls
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: '\n\n*💡 Thinking...*\n\n', done: false })}\n\n`)
              );
              
              const toolResults = [];
              
              // Execute all tool calls in parallel for better performance
              const toolPromises = toolCalls.map(async (toolCall) => {
                try {
                  // Safely parse JSON arguments
                  let args: any = {};
                  try {
                    args = JSON.parse(toolCall.function.arguments || '{}');
                  } catch (jsonError) {
                    console.error(`Failed to parse JSON for tool ${toolCall.function.name}:`, toolCall.function.arguments);
                    args = {}; // Default to empty object if JSON is malformed
                  }
                  
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
                    case "get_splitwise_expenses":
                      result = await getSplitwiseExpenses(args.groupId, args.limit, args.dateAfter, args.dateBefore);
                      break;
                    case "get_splitwise_friends":
                      result = await getSplitwiseFriends();
                      break;
                    case "get_splitwise_current_user":
                      result = await getSplitwiseCurrentUser();
                      break;
                    case "get_splitwise_groups":
                      result = await getSplitwiseGroups();
                      break;
                    default:
                      result = { error: `Unknown function: ${toolCall.function.name}` };
                  }
                  
                  return {
                    role: "tool" as const,
                    content: JSON.stringify(result),
                    tool_call_id: toolCall.id
                  };
                } catch (error) {
                  console.error(`Error executing tool ${toolCall.function.name}:`, error);
                  return {
                    role: "tool" as const,
                    content: JSON.stringify({ error: `Failed to execute ${toolCall.function.name}` }),
                    tool_call_id: toolCall.id
                  };
                }
              });
              
              // Wait for all tool calls to complete
              const resolvedToolResults = await Promise.all(toolPromises);
              toolResults.push(...resolvedToolResults);
              
              // Clean up tool calls for OpenAI - remove index property and ensure proper structure
              const cleanedToolCalls = toolCalls.map(tc => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments
                }
              }));
              
              // Get follow-up response with tool results
              const followUpStream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  systemMessage,
                  ...messages,
                  { 
                    role: "assistant", 
                    content: accumulatedMessage || null, 
                    tool_calls: cleanedToolCalls 
                  },
                  ...toolResults
                ],
                stream: true
              });
              
              for await (const followUpChunk of followUpStream) {
                const followUpDelta = followUpChunk.choices[0]?.delta;
                
                if (followUpDelta?.content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: followUpDelta.content, done: false })}\n\n`)
                  );
                }
                
                if (followUpChunk.choices[0]?.finish_reason === 'stop') {
                  isComplete = true;
                  break;
                }
              }
            }
            
            if (chunk.choices[0]?.finish_reason === 'stop' || isComplete) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
              );
              break;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed', done: true })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat streaming API error:', error);
    return NextResponse.json(
      { error: 'Failed to process streaming chat request' },
      { status: 500 }
    );
  }
} 
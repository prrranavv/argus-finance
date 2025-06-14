// Helper function to get the correct base URL
function getBaseUrl(): string {
  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // For production - try Vercel environment variables first
  if (process.env.VERCEL_URL) {
    const baseUrl = `https://${process.env.VERCEL_URL}`;
    console.log('Using VERCEL_URL:', baseUrl);
    return baseUrl;
  }
  
  // If running on Vercel but VERCEL_URL isn't available, use the production domain
  if (process.env.VERCEL) {
    const baseUrl = 'https://argus-finance.vercel.app';
    console.log('Using hardcoded production URL:', baseUrl);
    return baseUrl;
  }
  
  // Final fallback for production
  const baseUrl = 'https://argus-finance.vercel.app';
  console.log('Using final fallback URL:', baseUrl);
  return baseUrl;
}

// Function to get monthly expense data
export async function getMonthlyExpense(bank?: string) {
  try {
    const baseUrl = getBaseUrl();
    console.log('Base URL for getMonthlyExpense:', baseUrl);
    
    const url = new URL('/api/monthly-summary-v2', baseUrl);
    if (bank && bank !== 'Total') {
      url.searchParams.set('bank', bank);
    }

    console.log('Fetching monthly data from:', url.toString());
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Monthly data fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch monthly data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Monthly data fetched successfully');
    return data;
  } catch (error) {
    console.error('Error fetching monthly expense data:', error);
    return { error: `Unable to fetch expense data: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to search transactions
export async function searchTransactions(query?: string, bank?: string, timeRange?: string, limit: number = 10) {
  try {
    const baseUrl = getBaseUrl();
    console.log('Base URL for searchTransactions:', baseUrl);
    
    const url = new URL('/api/all-transactions', baseUrl);
    if (bank && bank !== 'Total') {
      url.searchParams.set('bank_name', bank);
    }
    if (timeRange) {
      url.searchParams.set('time_range', timeRange);
    }

    console.log('Fetching transactions from:', url.toString());
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Transaction fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }

    let transactions = await response.json();
    console.log('Fetched transactions count:', transactions.length);
    
    // Apply search filter if provided
    if (query) {
      const searchLower = query.toLowerCase();
      transactions = transactions.filter((t: any) => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      );
      console.log('Filtered transactions count:', transactions.length);
    }

    // Limit results
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error searching transactions:', error);
    return { error: `Unable to search transactions: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get spending by category
export async function getSpendingByCategory(timeRange?: string, bank?: string) {
  try {
    const baseUrl = getBaseUrl();
    console.log('Base URL for getSpendingByCategory:', baseUrl);
    
    const url = new URL('/api/transaction-metrics', baseUrl);
    if (timeRange) {
      url.searchParams.set('timeRange', timeRange);
    }
    if (bank && bank !== 'all') {
      url.searchParams.set('bank', bank);
    }

    console.log('Fetching spending data from:', url.toString());
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('Spending data fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch spending data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Spending data fetched successfully');
    return {
      topCategories: data.breakdown?.topCategories || [],
      totalExpenses: data.metrics?.totalExpenses?.current || 0,
      recurringPayments: data.insights?.recurringPayments || [],
      topExpenses: data.topExpenses || []
    };
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    return { error: `Unable to fetch spending data: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get Splitwise expenses
export async function getSplitwiseExpenses(groupId?: string, limit: number = 20, dateAfter?: string, dateBefore?: string) {
  try {
    const baseUrl = getBaseUrl();
    
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
export async function getSplitwiseFriends() {
  try {
    const baseUrl = getBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/splitwise/friends`);
    if (!response.ok) {
      throw new Error('Failed to fetch Splitwise friends');
    }

    const data = await response.json();
    
    // Check if data has friends property (array) or is already an array
    if (data && typeof data === 'object' && data.friends && Array.isArray(data.friends)) {
      return data.friends;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      return { error: 'No friends data found or invalid format' };
    }
  } catch (error) {
    console.error('Error fetching Splitwise friends:', error);
    return { error: 'Unable to fetch Splitwise friends' };
  }
}

// Function to get Splitwise current user info
export async function getSplitwiseCurrentUser() {
  try {
    const baseUrl = getBaseUrl();
    
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
export async function getSplitwiseGroups() {
  try {
    const baseUrl = getBaseUrl();
    
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

// Tool execution dispatcher
export async function executeToolFunction(functionName: string, args: any) {
  try {
    // Safely parse JSON arguments
    let parsedArgs: any = {};
    try {
      parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
    } catch (jsonError) {
      console.error(`Failed to parse JSON for tool ${functionName}:`, args);
      parsedArgs = {}; // Default to empty object if JSON is malformed
    }
    
    let result;
    
    switch (functionName) {
      case "get_monthly_expense":
        result = await getMonthlyExpense(parsedArgs.bank);
        break;
      case "search_transactions":
        result = await searchTransactions(parsedArgs.query, parsedArgs.bank, parsedArgs.timeRange, parsedArgs.limit);
        break;
      case "get_spending_by_category":
        result = await getSpendingByCategory(parsedArgs.timeRange, parsedArgs.bank);
        break;
      case "get_splitwise_expenses":
        result = await getSplitwiseExpenses(parsedArgs.groupId, parsedArgs.limit, parsedArgs.dateAfter, parsedArgs.dateBefore);
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
        result = { error: `Unknown function: ${functionName}` };
    }
    
    return result;
  } catch (error) {
    console.error(`Error executing tool ${functionName}:`, error);
    return { error: `Failed to execute ${functionName}` };
  }
} 
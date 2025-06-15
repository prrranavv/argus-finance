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
export async function getMonthlyExpense(bank?: string, userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for monthly expense data');
    }

    console.log('💰 Fetching monthly expense data for user:', userId);
    
    // Get transactions for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let query_builder = supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sixMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Apply bank filter if specified
    if (bank && bank !== 'Total') {
      query_builder = query_builder.eq('bank_name', bank);
    }

    const { data: transactions, error } = await query_builder;
    
    if (error) {
      console.error('Database error fetching monthly expenses:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Group transactions by month and calculate totals
    const monthlyData: { [key: string]: { income: number; expenses: number; month: string } } = {};
    
    transactions?.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, month: monthName };
      }
      
      if (transaction.amount > 0) {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount);
      }
    });

    // Convert to array and sort by date
    const result = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('Monthly expense data fetched successfully, months:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching monthly expense data:', error);
    return { error: `Unable to fetch expense data: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to search transactions
export async function searchTransactions(query?: string, bank?: string, timeRange?: string, limit: number = 10, userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for transaction search');
    }

    console.log('🔍 Searching transactions for user:', userId);
    
    let query_builder = supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply bank filter
    if (bank && bank !== 'Total') {
      query_builder = query_builder.eq('bank_name', bank);
    }

    // Apply time range filter
    if (timeRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      query_builder = query_builder.gte('date', startDate.toISOString().split('T')[0]);
    }

    const { data: transactions, error } = await query_builder.limit(100);
    
    if (error) {
      console.error('Database error searching transactions:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    let filteredTransactions = transactions || [];
    console.log('Fetched transactions count:', filteredTransactions.length);
    
    // Apply search filter if provided
    if (query) {
      const searchLower = query.toLowerCase();
      filteredTransactions = filteredTransactions.filter((t: any) => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      );
      console.log('Filtered transactions count:', filteredTransactions.length);
    }

    // Limit results
    return filteredTransactions.slice(0, limit);
  } catch (error) {
    console.error('Error searching transactions:', error);
    return { error: `Unable to search transactions: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get spending by category
export async function getSpendingByCategory(timeRange?: string, bank?: string, userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for spending by category data');
    }

    console.log('📊 Fetching spending by category for user:', userId);
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '60days':
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    let query_builder = supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lt('amount', 0); // Only expenses (negative amounts)

    // Apply bank filter if specified
    if (bank && bank !== 'all' && bank !== 'Total') {
      query_builder = query_builder.eq('bank_name', bank);
    }

    const { data: transactions, error } = await query_builder;
    
    if (error) {
      console.error('Database error fetching spending by category:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Group by category and calculate totals
    const categoryTotals: { [key: string]: number } = {};
    let totalExpenses = 0;
    const topExpenses: any[] = [];
    
    transactions?.forEach((transaction: any) => {
      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(transaction.amount);
      
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalExpenses += amount;
      
      // Add to top expenses
      topExpenses.push({
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        category: category,
        bank_name: transaction.bank_name
      });
    });

    // Convert to array and sort by amount
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Sort top expenses by amount
    topExpenses.sort((a, b) => b.amount - a.amount);

    console.log('Spending by category data fetched successfully, categories:', topCategories.length);
    return {
      topCategories,
      totalExpenses,
      recurringPayments: [], // Would need more complex logic to detect recurring payments
      topExpenses: topExpenses.slice(0, 20)
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

// Function to get key financial metrics
export async function getKeyMetrics(userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for key metrics');
    }

    console.log('📊 Fetching key metrics for user:', userId);
    
    // Get recent transactions for calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: transactions, error } = await supabaseAdmin
      .from('all_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Database error fetching key metrics:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate key metrics
    let totalBalance = 0;
    let totalExpenses = 0;
    let totalIncome = 0;
    const bankBalances: { [key: string]: number } = {};
    
    transactions?.forEach((transaction: any) => {
      const amount = transaction.amount;
      const bank = transaction.bank_name || 'Unknown';
      
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
      
      // Track bank balances (this is simplified - real balance would need more complex logic)
      bankBalances[bank] = (bankBalances[bank] || 0) + amount;
    });

    // Get latest balance from balances table if available
    const { data: balances } = await supabaseAdmin
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .eq('account_type', 'Bank Account')
      .order('last_expense_date', { ascending: false })
      .limit(10);

    if (balances && balances.length > 0) {
      totalBalance = balances.reduce((sum, balance) => sum + (balance.closing_balance || 0), 0);
    }

    console.log('Key metrics fetched successfully');
    return {
      totalBalance,
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      bankBalances,
      transactionCount: transactions?.length || 0
    };
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    return { error: `Unable to fetch key metrics: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get balance progression over time
export async function getBalanceProgression(bank?: string, userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for balance progression');
    }

    console.log('📈 Fetching balance progression for user:', userId);
    
    let query_builder = supabaseAdmin
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .eq('account_type', 'Bank Account')
      .order('last_expense_date', { ascending: true });

    // Apply bank filter if specified
    if (bank && bank !== 'Total') {
      query_builder = query_builder.eq('bank_name', bank);
    }

    const { data: balances, error } = await query_builder;
    
    if (error) {
      console.error('Database error fetching balance progression:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Format data for charts
    const progressionData = balances?.map((balance: any) => ({
      date: balance.last_expense_date,
      month: balance.statement_month,
      balance: balance.closing_balance,
      bank: balance.bank_name,
      accountType: balance.account_type
    })) || [];

    console.log('Balance progression fetched successfully, records:', progressionData.length);
    return progressionData;
  } catch (error) {
    console.error('Error fetching balance progression:', error);
    return { error: `Unable to fetch balance progression: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get credit card progression over time
export async function getCreditCardProgression(userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for credit card progression');
    }

    console.log('💳 Fetching credit card progression for user:', userId);
    
    const { data: balances, error } = await supabaseAdmin
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .eq('account_type', 'Credit Card')
      .order('last_expense_date', { ascending: true });
    
    if (error) {
      console.error('Database error fetching credit card progression:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Format data for charts
    const progressionData = balances?.map((balance: any) => ({
      date: balance.last_expense_date,
      month: balance.statement_month,
      balance: balance.closing_balance,
      bank: balance.bank_name,
      cardName: balance.bank_name,
      creditLimit: balance.credit_limit,
      dueDate: balance.due_date,
      amountDue: balance.credit_card_amount_due
    })) || [];

    console.log('Credit card progression fetched successfully, records:', progressionData.length);
    return progressionData;
  } catch (error) {
    console.error('Error fetching credit card progression:', error);
    return { error: `Unable to fetch credit card progression: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get credit card summary by card
export async function getCreditCardSummary(card?: string, userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for credit card summary');
    }

    console.log('💳 Fetching credit card summary for user:', userId, 'card:', card);
    
    let query_builder = supabaseAdmin
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .eq('account_type', 'Credit Card')
      .order('last_expense_date', { ascending: false });

    // Apply card filter if specified
    if (card && card !== 'Total') {
      query_builder = query_builder.eq('bank_name', card);
    }

    const { data: balances, error } = await query_builder;
    
    if (error) {
      console.error('Database error fetching credit card summary:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Format data for summary
    const result = balances?.map((balance: any) => ({
      month: balance.statement_month,
      date: balance.last_expense_date,
      accountBalance: balance.closing_balance,
      creditLimit: balance.credit_limit,
      dueDate: balance.due_date,
      amountDue: balance.credit_card_amount_due,
      rewardPoints: balance.reward_points
    })) || [];

    console.log('Credit card summary fetched successfully, months:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching credit card summary:', error);
    return { error: `Unable to fetch credit card summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get available bank names
export async function getBankNames(userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for bank names');
    }

    console.log('🏦 Fetching bank names for user:', userId);
    
    const { data: transactions, error } = await supabaseAdmin
      .from('all_transactions')
      .select('bank_name')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database error fetching bank names:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Get unique bank names
    const uniqueBanks = [...new Set(transactions?.map((t: any) => t.bank_name).filter(Boolean))];

    console.log('Bank names fetched successfully, count:', uniqueBanks.length);
    return uniqueBanks;
  } catch (error) {
    console.error('Error fetching bank names:', error);
    return { error: `Unable to fetch bank names: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get banks with their account types
export async function getBanksWithTypes(userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for banks with types');
    }

    console.log('🏦 Fetching banks with types for user:', userId);
    
    const { data: transactions, error } = await supabaseAdmin
      .from('all_transactions')
      .select('bank_name, account_type')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database error fetching banks with types:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Group by bank and account type
    const bankTypes: { [key: string]: Set<string> } = {};
    
    transactions?.forEach((transaction: any) => {
      const bank = transaction.bank_name;
      const type = transaction.account_type;
      
      if (bank && type) {
        if (!bankTypes[bank]) {
          bankTypes[bank] = new Set();
        }
        bankTypes[bank].add(type);
      }
    });

    // Convert to array format
    const result = Object.entries(bankTypes).map(([bank, types]) => ({
      bank,
      accountTypes: Array.from(types)
    }));

    console.log('Banks with types fetched successfully, banks:', result.length);
    return result;
  } catch (error) {
    console.error('Error fetching banks with types:', error);
    return { error: `Unable to fetch banks with types: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Function to get statements list
export async function getStatements(userId?: string) {
  try {
    // Use direct database access instead of API calls to avoid auth issues
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    if (!userId) {
      throw new Error('User ID is required for statements');
    }

    console.log('📄 Fetching statements for user:', userId);
    
    const { data: statements, error } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error fetching statements:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Statements fetched successfully, count:', statements?.length || 0);
    return statements || [];
  } catch (error) {
    console.error('Error fetching statements:', error);
    return { error: `Unable to fetch statements: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Tool execution dispatcher
export async function executeToolFunction(functionName: string, args: any, userId?: string) {
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
        result = await getMonthlyExpense(parsedArgs.bank, userId);
        break;
      case "search_transactions":
        result = await searchTransactions(parsedArgs.query, parsedArgs.bank, parsedArgs.timeRange, parsedArgs.limit, userId);
        break;
      case "get_spending_by_category":
        result = await getSpendingByCategory(parsedArgs.timeRange, parsedArgs.bank, userId);
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
      case "get_key_metrics":
        result = await getKeyMetrics(userId);
        break;
      case "get_balance_progression":
        result = await getBalanceProgression(parsedArgs.bank, userId);
        break;
      case "get_credit_card_progression":
        result = await getCreditCardProgression(userId);
        break;
      case "get_credit_card_summary":
        result = await getCreditCardSummary(parsedArgs.card, userId);
        break;
      case "get_bank_names":
        result = await getBankNames(userId);
        break;
      case "get_banks_with_types":
        result = await getBanksWithTypes(userId);
        break;
      case "get_statements":
        result = await getStatements(userId);
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
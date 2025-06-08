// Supabase Database Types
export interface Statement {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_hash?: string
  file_url?: string
  uploaded_at: string
  processed: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category?: string
  type: string
  source: string
  account_type: string
  bank_name: string
  statement_id?: string
  created_at: string
  updated_at: string
  closing_balance?: number
  opening_balance?: number
  running_balance?: number
  credit_limit?: number
  due_date?: string
  reward_points?: number
  merchant_category?: string
  mode?: string
}

// Database insert types (without auto-generated fields)
export interface StatementInsert {
  file_name: string
  file_type: string
  file_size: number
  file_hash?: string
  file_url?: string
  processed?: boolean
}

export interface TransactionInsert {
  date: string
  description: string
  amount: number
  category?: string
  type: string
  source: string
  account_type: string
  bank_name: string
  statement_id?: string
  closing_balance?: number
  opening_balance?: number
  running_balance?: number
  credit_limit?: number
  due_date?: string
  reward_points?: number
  merchant_category?: string
  mode?: string
}

// API Response types
export interface BalanceProgression {
  date: string
  balance: number
}

export interface TransactionMetrics {
  totalTransactions: number
  totalDebits: number
  totalCredits: number
  averageTransaction: number
  highestDebit: number
  highestCredit: number
}

export interface CreditCardProgression {
  date: string
  balance: number
  credit_limit: number
  utilization: number
} 
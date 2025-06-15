// Supabase Database Types

// User type
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  preferences: {
    privacy_mode: boolean
    theme: 'system' | 'light' | 'dark'
    notifications: {
      email_sync: boolean
      transaction_alerts: boolean
    }
  }
}

// User insert type
export interface UserInsert {
  id?: string
  email: string
  full_name?: string
  avatar_url?: string
  preferences?: {
    privacy_mode?: boolean
    theme?: 'system' | 'light' | 'dark'
    notifications?: {
      email_sync?: boolean
      transaction_alerts?: boolean
    }
  }
}

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
  user_id: string
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
  user_id: string
  email_id?: string
  gmail_message_id?: string
  reference_number?: string
}

// Database insert types (without auto-generated fields)
export interface StatementInsert {
  file_name: string
  file_type: string
  file_size: number
  file_hash?: string
  file_url?: string
  processed?: boolean
  user_id: string
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
  user_id: string
  email_id?: string
  gmail_message_id?: string
  reference_number?: string
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

// Email type
export interface Email {
  id: string
  gmail_message_id: string
  from_email: string
  subject: string
  received_date: string
  attachment_urls: string[]
  account_type?: 'credit_card' | 'bank_account'
  bank_name?: string
  content?: string
  created_at: string
  updated_at: string
  is_relevant?: boolean
  user_id: string
}

// Balance type
export interface Balance {
  id: string
  last_expense_date: string
  account_type: string
  bank_name: string
  closing_balance?: number
  credit_limit?: number
  due_date?: string
  reward_points?: number
  statement_id?: string
  created_at: string
  updated_at: string
  statement_month?: string
  last_transaction_id?: string
  credit_card_amount_due?: number
  user_id: string
} 
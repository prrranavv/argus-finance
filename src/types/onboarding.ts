// Onboarding Types

export interface UserAccount {
  id: string
  user_id: string
  bank_name: string
  account_number?: string
  account_type: 'bank_account' | 'credit_card'
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface UserAccountInsert {
  user_id?: string // Will be set automatically via RLS
  bank_name: string
  account_number?: string
  account_type: 'bank_account' | 'credit_card'
  is_primary?: boolean
}

export interface UserIntegration {
  id: string
  user_id: string
  integration_type: 'gmail' | 'splitwise'
  access_token_encrypted?: string
  refresh_token_encrypted?: string
  token_expires_at?: string
  additional_data: Record<string, any>
  is_active: boolean
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface UserIntegrationInsert {
  user_id?: string // Will be set automatically via RLS
  integration_type: 'gmail' | 'splitwise'
  access_token_encrypted?: string
  refresh_token_encrypted?: string
  token_expires_at?: string
  additional_data?: Record<string, any>
  is_active?: boolean
}

export interface UserOnboarding {
  id: string
  user_id: string
  current_step: 'personal_info' | 'accounts' | 'integrations' | 'completed'
  steps_completed: {
    personal_info: boolean
    accounts: boolean
    integrations: boolean
  }
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface OnboardingStep {
  id: 'personal_info' | 'accounts' | 'integrations'
  title: string
  description: string
  completed: boolean
  current: boolean
}

// Form data types for onboarding steps
export interface PersonalInfoForm {
  full_name: string
  privacy_mode: boolean
  theme: 'system' | 'light' | 'dark'
  notifications: {
    email_sync: boolean
    transaction_alerts: boolean
  }
}

export interface AccountForm {
  bank_name: string
  account_number: string
  account_type: 'bank_account' | 'credit_card'
  is_primary: boolean
}

export interface SplitwiseIntegrationForm {
  api_key: string
}

export interface GmailIntegrationForm {
  access_token: string
  refresh_token: string
  expires_at?: string
}

// API response types
export interface OnboardingStatusResponse {
  onboarding: UserOnboarding
  accounts: UserAccount[]
  integrations: UserIntegration[]
}

export interface CreateAccountResponse {
  success: boolean
  account?: UserAccount
  message?: string
}

export interface CreateIntegrationResponse {
  success: boolean
  integration?: UserIntegration
  message?: string
}

export interface UpdateOnboardingResponse {
  success: boolean
  onboarding?: UserOnboarding
  message?: string
} 
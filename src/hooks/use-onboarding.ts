'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  UserOnboarding, 
  UserAccount, 
  UserIntegration,
  OnboardingStatusResponse,
  PersonalInfoForm,
  AccountForm,
  SplitwiseIntegrationForm,
  OnboardingStep
} from '@/types/onboarding'

export function useOnboarding() {
  const { user, updateProfile } = useAuth()
  const [onboarding, setOnboarding] = useState<UserOnboarding | null>(null)
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch onboarding status
  const fetchOnboardingStatus = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/onboarding/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status')
      }

      const data: OnboardingStatusResponse = await response.json()
      setOnboarding(data.onboarding)
      setAccounts(data.accounts)
      setIntegrations(data.integrations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update personal info step
  const updatePersonalInfo = useCallback(async (formData: PersonalInfoForm) => {
    try {
      setLoading(true)
      
      // Update user profile in the users table
      await updateProfile({
        full_name: formData.full_name,
        preferences: {
          privacy_mode: formData.privacy_mode,
          theme: formData.theme,
          notifications: formData.notifications
        }
      })

      // Also update the auth user metadata
      const response = await fetch('/api/auth/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          full_name: formData.full_name 
        })
      })

      if (!response.ok) {
        console.warn('Failed to update auth metadata, but continuing...')
      }

      // Mark step as completed
      const stepResponse = await fetch('/api/onboarding/update-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'personal_info', completed: true })
      })

      if (!stepResponse.ok) {
        throw new Error('Failed to update onboarding step')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update personal info'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [updateProfile, fetchOnboardingStatus])

  // Add account
  const addAccount = useCallback(async (accountData: AccountForm) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/onboarding/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      })

      if (!response.ok) {
        throw new Error('Failed to add account')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add account'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [fetchOnboardingStatus])

  // Complete accounts step
  const completeAccountsStep = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/update-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'accounts', completed: true })
      })

      if (!response.ok) {
        throw new Error('Failed to complete accounts step')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete accounts step'
      setError(message)
      return { success: false, message }
    }
  }, [fetchOnboardingStatus])

  // Add Splitwise integration
  const addSplitwiseIntegration = useCallback(async (integrationData: SplitwiseIntegrationForm) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/onboarding/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'splitwise',
          access_token: integrationData.api_key
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add Splitwise integration')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add Splitwise integration'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [fetchOnboardingStatus])

  // Complete integrations step (can be skipped)
  const completeIntegrationsStep = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/update-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'integrations', completed: true })
      })

      if (!response.ok) {
        throw new Error('Failed to complete integrations step')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete integrations step'
      setError(message)
      return { success: false, message }
    }
  }, [fetchOnboardingStatus])

  // Remove account
  const removeAccount = useCallback(async (accountId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/onboarding/accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove account')
      }

      await fetchOnboardingStatus()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove account'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [fetchOnboardingStatus])

  // Get onboarding steps with current state
  const getOnboardingSteps = useCallback((): OnboardingStep[] => {
    if (!onboarding) return []

    return [
      {
        id: 'personal_info',
        title: 'Personal Information',
        description: 'Tell us about yourself and set your preferences',
        completed: onboarding.steps_completed.personal_info,
        current: onboarding.current_step === 'personal_info'
      },
      {
        id: 'accounts',
        title: 'Bank Accounts & Credit Cards',
        description: 'Add your financial accounts for transaction mapping',
        completed: onboarding.steps_completed.accounts,
        current: onboarding.current_step === 'accounts'
      },
      {
        id: 'integrations',
        title: 'Integrations',
        description: 'Connect Splitwise and other services (optional)',
        completed: onboarding.steps_completed.integrations,
        current: onboarding.current_step === 'integrations'
      }
    ]
  }, [onboarding])

  // Check if user needs onboarding
  const needsOnboarding = onboarding && !onboarding.is_completed

  // Initialize onboarding status on mount
  useEffect(() => {
    if (user) {
      fetchOnboardingStatus()
    }
  }, [user, fetchOnboardingStatus])

  return {
    // State
    onboarding,
    accounts,
    integrations,
    loading,
    error,
    needsOnboarding,
    
    // Actions
    updatePersonalInfo,
    addAccount,
    removeAccount,
    completeAccountsStep,
    addSplitwiseIntegration,
    completeIntegrationsStep,
    fetchOnboardingStatus,
    
    // Computed
    getOnboardingSteps,
    
    // Utils
    clearError: () => setError(null)
  }
} 
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useOnboarding } from '@/hooks/use-onboarding'
import { AccountForm, PersonalInfoForm, SplitwiseIntegrationForm } from '@/types/onboarding'
import { 
  User, 
  CreditCard, 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Bell,
  Palette,
  Users,
  Mail,
  Banknote,
  Zap,
  X,
  Check,
  ExternalLink,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { initiateGmailOAuth, testGmailOAuthConfig } from '@/lib/gmail-oauth'

interface OnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
  onSkip?: () => void
}

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const {
    onboarding,
    accounts,
    integrations,
    loading,
    error,
    updatePersonalInfo,
    addAccount,
    removeAccount,
    completeAccountsStep,
    addSplitwiseIntegration,
    completeIntegrationsStep,
    getOnboardingSteps,
    clearError
  } = useOnboarding()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Personal Info Form State
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoForm>({
    full_name: '',
    privacy_mode: true,
    theme: 'system' as const,
    notifications: {
      email_sync: true,
      transaction_alerts: true
    }
  })

  // Account Form State
  const [accountForm, setAccountForm] = useState<AccountForm>({
    bank_name: '',
    account_number: '',
    account_type: 'bank_account',
    is_primary: false
  })

  // Splitwise Integration Form State
  const [splitwiseForm, setSplitwiseForm] = useState<SplitwiseIntegrationForm>({
    api_key: ''
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)

  const steps = getOnboardingSteps()
  const currentStep = steps[currentStepIndex]

  // Update current step index based on onboarding progress
  useEffect(() => {
    if (onboarding && steps.length > 0) {
      const currentStepId = onboarding.current_step
      const stepIndex = steps.findIndex(step => step.id === currentStepId)
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex)
      }
    }
  }, [onboarding, steps])

  // Clear errors when step changes
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [currentStepIndex, clearError, error])

  const handlePersonalInfoSubmit = async () => {
    if (!personalInfo.full_name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updatePersonalInfo(personalInfo)
      if (result.success) {
        toast.success('Welcome aboard! 🎉')
        setCurrentStepIndex(1)
      } else {
        toast.error(result.message || 'Failed to save personal information')
      }
    } catch (error) {
      toast.error('Failed to save personal information')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAccount = async () => {
    if (!accountForm.bank_name.trim() || !accountForm.account_number.trim()) {
      toast.error('Please fill in all account details')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addAccount(accountForm)
      if (result.success) {
        toast.success('Account added! 💳')
        setAccountForm({
          bank_name: '',
          account_number: '',
          account_type: 'bank_account',
          is_primary: false
        })
        setShowAccountForm(false)
      } else {
        toast.error(result.message || 'Failed to add account')
      }
    } catch (error) {
      toast.error('Failed to add account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteAccountsStep = async () => {
    setIsSubmitting(true)
    try {
      const result = await completeAccountsStep()
      if (result.success) {
        toast.success('Accounts configured! 🏦')
        setCurrentStepIndex(2)
      } else {
        toast.error(result.message || 'Failed to complete accounts step')
      }
    } catch (error) {
      toast.error('Failed to complete accounts step')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSplitwiseOAuth = async () => {
    try {
      const { initiateSplitwiseOAuth } = await import('@/lib/splitwise-oauth')
      await initiateSplitwiseOAuth()
    } catch (error) {
      console.error('Splitwise OAuth error:', error)
      toast.error('OAuth setup required. Please use API key for now.')
    }
  }

  const handleGmailOAuth = async () => {
    try {
      await initiateGmailOAuth()
    } catch (error) {
      console.error('Gmail OAuth error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to connect Gmail')
    }
  }

  const handleAddSplitwiseIntegration = async () => {
    if (!splitwiseForm.api_key.trim()) {
      toast.error('Please enter your Splitwise API key')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addSplitwiseIntegration(splitwiseForm)
      if (result.success) {
        toast.success('Splitwise connected! 🤝')
        setSplitwiseForm({ api_key: '' })
      } else {
        toast.error(result.message || 'Failed to add Splitwise integration')
      }
    } catch (error) {
      toast.error('Failed to add Splitwise integration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteIntegrationsStep = async () => {
    setIsSubmitting(true)
    try {
      const result = await completeIntegrationsStep()
      if (result.success) {
        toast.success('Setup complete! Welcome to Argus! 🚀')
        onComplete()
      } else {
        toast.error(result.message || 'Failed to complete onboarding')
      }
    } catch (error) {
      toast.error('Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveAccount = async (accountId: string) => {
    setIsSubmitting(true)
    try {
      const result = await removeAccount(accountId)
      if (result.success) {
        toast.success('Account removed')
      } else {
        toast.error(result.message || 'Failed to remove account')
      }
    } catch (error) {
      toast.error('Failed to remove account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete()
    }
  }

  const bankSuggestions = [
    'HDFC',
    'Axis',
    'ICICI',
    'SBI',
    'Kotak',
    'IDFC',
    'RBL',
    'Federal',
    'IndusInd'
  ]

  const creditCardSuggestions = [
    'HDFC Infinia',
    'HDFC Diners Club Black',
    'American Express Platinum',
    'American Express Membership Rewards',
    'Axis Magnus',
    'Axis Reserve',
    'Axis Atlas',
    'Axis Burgundy Private',
    'ICICI Emeralde',
    'ICICI Sapphiro',
    'SBI Card ELITE',
    'IndusInd Pinnacle',
    'HSBC Bank Premier',
    'HDFC Tata Neu',
    'HDFC Swiggy',
    'ICICI Amazon Pay',
    'Axis Flipkart',
    'Axis Vistara'
  ]

  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Handle bank name input change with autocomplete
  const handleBankNameChange = (value: string) => {
    setAccountForm(prev => ({ ...prev, bank_name: value }))
    
    if (value.length > 0) {
      const suggestions = accountForm.account_type === 'credit_card' 
        ? creditCardSuggestions 
        : bankSuggestions
      
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setAccountForm(prev => ({ ...prev, bank_name: suggestion }))
    setShowSuggestions(false)
  }

  // Bank/Credit Card Component
  const AccountCard = ({ account, onRemove }: { account: any, onRemove: (id: string) => void }) => (
    <div className="relative group">
      <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
        account.account_type === 'credit_card' 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300' 
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              account.account_type === 'credit_card' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {account.account_type === 'credit_card' ? (
                <CreditCard className="h-5 w-5 text-blue-600" />
              ) : (
                <Building2 className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
              <p className="text-sm text-gray-600">
                {account.account_type === 'credit_card' ? 'Credit Card' : 'Bank Account'}
              </p>
            </div>
          </div>
          {account.is_primary && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Primary
            </Badge>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Account Number</span>
            <span className="font-mono text-sm">****{account.account_number?.slice(-4)}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(account.id)}
          disabled={isSubmitting}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Setting up your experience...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Onboarding</DialogTitle>
          <DialogDescription>Complete your profile setup</DialogDescription>
        </DialogHeader>

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                step.completed 
                  ? 'bg-green-500' 
                  : index === currentStepIndex
                  ? 'bg-primary'
                  : 'bg-gray-200'
              }`} />
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 transition-all duration-200 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStepIndex === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
                <p className="text-muted-foreground">Just the basics to get started</p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">What should we call you?</Label>
                    <Input
                      id="full_name"
                      placeholder="Your full name"
                      value={personalInfo.full_name}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, full_name: e.target.value }))}
                      className="text-center"
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span>Privacy Mode</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">Hide amounts by default</p>
                      </div>
                      <Switch
                        checked={personalInfo.privacy_mode}
                        onCheckedChange={(checked) => setPersonalInfo(prev => ({ ...prev, privacy_mode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <span>Smart Notifications</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">Get helpful alerts</p>
                      </div>
                      <Switch
                        checked={personalInfo.notifications.transaction_alerts}
                        onCheckedChange={(checked) => 
                          setPersonalInfo(prev => ({ 
                            ...prev, 
                            notifications: { ...prev.notifications, transaction_alerts: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          )}

          {/* Step 2: Bank Accounts & Credit Cards */}
          {currentStepIndex === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Add your accounts</h2>
                <p className="text-muted-foreground">Help us map your transactions accurately</p>
              </div>

              {/* Existing Accounts */}
              {accounts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-center">Your Accounts ({accounts.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {accounts.map((account) => (
                      <AccountCard 
                        key={account.id} 
                        account={account} 
                        onRemove={handleRemoveAccount}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Account Form - Always show for first account */}
              {(accounts.length === 0 || showAccountForm) ? (
                <Card className="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Add Account
                      {accounts.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAccountForm(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={accountForm.account_type === 'bank_account' ? 'default' : 'outline'}
                        onClick={() => setAccountForm(prev => ({ ...prev, account_type: 'bank_account' }))}
                        className="h-12"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Bank
                      </Button>
                      <Button
                        variant={accountForm.account_type === 'credit_card' ? 'default' : 'outline'}
                        onClick={() => setAccountForm(prev => ({ ...prev, account_type: 'credit_card' }))}
                        className="h-12"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Credit Card
                      </Button>
                    </div>

                    <div className="space-y-2 relative">
                      <Label>
                        {accountForm.account_type === 'credit_card' ? 'Credit Card' : 'Bank/Institution'}
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder={accountForm.account_type === 'credit_card' ? 'e.g. HDFC Infinia' : 'e.g. HDFC'}
                          value={accountForm.bank_name}
                          onChange={(e) => handleBankNameChange(e.target.value)}
                          onFocus={() => {
                            if (accountForm.bank_name.length > 0) {
                              setShowSuggestions(true)
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicking
                            setTimeout(() => setShowSuggestions(false), 200)
                          }}
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => selectSuggestion(suggestion)}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Number (Last 4 digits)</Label>
                      <Input
                        placeholder="1234"
                        value={accountForm.account_number}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                        maxLength={16}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={accountForm.is_primary}
                        onCheckedChange={(checked) => setAccountForm(prev => ({ ...prev, is_primary: checked }))}
                      />
                      <Label>Primary account</Label>
                    </div>

                    <Button 
                      onClick={handleAddAccount}
                      disabled={isSubmitting || !accountForm.bank_name || !accountForm.account_number}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Account
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center">
                  <Button 
                    onClick={() => setShowAccountForm(true)}
                    variant="outline"
                    className="h-16 w-full max-w-md mx-auto border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Add Another Account</span>
                    </div>
                  </Button>
                </div>
              )}

              
            </div>
          )}

          {/* Step 3: Integrations */}
          {currentStepIndex === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Connect your apps</h2>
                <p className="text-muted-foreground">Optional integrations to enhance your experience</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {/* Splitwise Integration */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Splitwise</h3>
                        <p className="text-sm text-muted-foreground">
                          Track shared expenses and group payments
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {integrations.some(i => i.integration_type === 'splitwise') ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <div className="flex space-x-2">
                            <Button 
                              onClick={handleSplitwiseOAuth}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Connect
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              API Key
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {showApiKey && !integrations.some(i => i.integration_type === 'splitwise') && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="space-y-2">
                          <Label>Splitwise API Key</Label>
                          <div className="relative">
                            <Input
                              type={showApiKey ? 'text' : 'password'}
                              placeholder="Enter your Splitwise API key"
                              value={splitwiseForm.api_key}
                              onChange={(e) => setSplitwiseForm(prev => ({ ...prev, api_key: e.target.value }))}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Get your API key from{' '}
                            <a 
                              href="https://secure.splitwise.com/apps" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Splitwise Settings → Apps
                            </a>
                          </p>
                        </div>
                        <Button 
                          onClick={handleAddSplitwiseIntegration}
                          disabled={isSubmitting || !splitwiseForm.api_key.trim()}
                          size="sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect with API Key'
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Gmail Integration */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Gmail Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync transaction emails
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {integrations.some(i => i.integration_type === 'gmail') ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Button 
                            onClick={handleGmailOAuth}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer with CTAs */}
        <div className="border-t pt-6 mt-8">
          {currentStepIndex === 0 && (
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button 
                onClick={handlePersonalInfoSubmit}
                disabled={isSubmitting || !personalInfo.full_name.trim()}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStepIndex === 1 && (
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setCurrentStepIndex(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button 
                onClick={handleCompleteAccountsStep}
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStepIndex === 2 && (
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setCurrentStepIndex(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button 
                onClick={handleCompleteIntegrationsStep}
                disabled={isSubmitting}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
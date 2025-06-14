'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function ApiTestPage() {
  const { user, profile, loading } = useAuth()
  const [apiResult, setApiResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  const testKeyMetrics = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing key metrics API...')
      const response = await fetch('/api/key-metrics-v2')
      const data = await response.json()
      console.log('🧪 API Response:', data)
      setApiResult(data)
    } catch (error) {
      console.error('🧪 API Error:', error)
      setApiResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testBalanceProgression = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing balance progression API...')
      const response = await fetch('/api/balance-progression-v2')
      const data = await response.json()
      console.log('🧪 Balance API Response:', data)
      setApiResult({ api: 'balance-progression-v2', data })
    } catch (error) {
      console.error('🧪 Balance API Error:', error)
      setApiResult({ api: 'balance-progression-v2', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testCreditCardProgression = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing credit card progression API...')
      const response = await fetch('/api/credit-card-progression-v2')
      const data = await response.json()
      console.log('🧪 Credit Card API Response:', data)
      setApiResult({ api: 'credit-card-progression-v2', data })
    } catch (error) {
      console.error('🧪 Credit Card API Error:', error)
      setApiResult({ api: 'credit-card-progression-v2', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testTransactionMetrics = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing transaction metrics API...')
      const response = await fetch('/api/transaction-metrics')
      const data = await response.json()
      console.log('🧪 Transaction Metrics API Response:', data)
      setApiResult({ api: 'transaction-metrics', data })
    } catch (error) {
      console.error('🧪 Transaction Metrics API Error:', error)
      setApiResult({ api: 'transaction-metrics', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testMonthlySummary = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing monthly summary API...')
      const response = await fetch('/api/monthly-summary-v2')
      const data = await response.json()
      console.log('🧪 Monthly Summary API Response:', data)
      setApiResult({ api: 'monthly-summary-v2', data })
    } catch (error) {
      console.error('🧪 Monthly Summary API Error:', error)
      setApiResult({ api: 'monthly-summary-v2', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testAllTransactions = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing all transactions API...')
      const response = await fetch('/api/all-transactions?limit=10')
      const data = await response.json()
      console.log('🧪 All Transactions API Response:', data)
      setApiResult({ api: 'all-transactions', data: data.slice(0, 3) }) // Show only first 3 for readability
    } catch (error) {
      console.error('🧪 All Transactions API Error:', error)
      setApiResult({ api: 'all-transactions', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testStatements = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing statements API...')
      const response = await fetch('/api/statements')
      const data = await response.json()
      console.log('🧪 Statements API Response:', data)
      setApiResult({ api: 'statements', data })
    } catch (error) {
      console.error('🧪 Statements API Error:', error)
      setApiResult({ api: 'statements', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testBanksWithTypes = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing banks-with-types API...')
      const response = await fetch('/api/banks-with-types')
      const data = await response.json()
      console.log('🧪 Banks-with-Types API Response:', data)
      setApiResult({ api: 'banks-with-types', data })
    } catch (error) {
      console.error('🧪 Banks-with-Types API Error:', error)
      setApiResult({ api: 'banks-with-types', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testBankNames = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing bank-names API...')
      const response = await fetch('/api/bank-names')
      const data = await response.json()
      console.log('🧪 Bank Names API Response:', data)
      setApiResult({ api: 'bank-names', data })
    } catch (error) {
      console.error('🧪 Bank Names API Error:', error)
      setApiResult({ api: 'bank-names', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testClearDuplicates = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing clear-duplicates API...')
      const response = await fetch('/api/clear-duplicates', { method: 'POST' })
      const data = await response.json()
      console.log('🧪 Clear Duplicates API Response:', data)
      setApiResult({ api: 'clear-duplicates', data })
    } catch (error) {
      console.error('🧪 Clear Duplicates API Error:', error)
      setApiResult({ api: 'clear-duplicates', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  const testCreditCardSummary = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing credit-card-summary-v2 API...')
      const response = await fetch('/api/credit-card-summary-v2')
      const data = await response.json()
      console.log('🧪 Credit Card Summary API Response:', data)
      setApiResult({ api: 'credit-card-summary-v2', data })
    } catch (error) {
      console.error('🧪 Credit Card Summary API Error:', error)
      setApiResult({ api: 'credit-card-summary-v2', error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">Please sign in first</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-black">🧪 API Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-black">User Info</h2>
            <div className="space-y-2 text-black">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Profile:</strong> {profile ? 'Loaded' : 'Not loaded'}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-black">API Test</h2>
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={testKeyMetrics} disabled={testLoading} className="bg-black text-white hover:bg-gray-800">
                {testLoading ? 'Testing...' : 'Key Metrics'}
              </Button>
              <Button onClick={testBalanceProgression} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Balance API'}
              </Button>
              <Button onClick={testCreditCardProgression} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Credit Card'}
              </Button>
              <Button onClick={testMonthlySummary} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Monthly Summary'}
              </Button>
              <Button onClick={testTransactionMetrics} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Transaction Metrics'}
              </Button>
              <Button onClick={testAllTransactions} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'All Transactions'}
              </Button>
              <Button onClick={testStatements} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Statements'}
              </Button>
              <Button onClick={testBanksWithTypes} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Banks with Types'}
              </Button>
              <Button onClick={testBankNames} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Bank Names'}
              </Button>
              <Button onClick={testClearDuplicates} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Clear Duplicates'}
              </Button>
              <Button onClick={testCreditCardSummary} disabled={testLoading} variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                {testLoading ? 'Testing...' : 'Credit Card Summary'}
              </Button>
            </div>
          </div>

          {apiResult && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-black">API Result</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto text-black font-mono">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex space-x-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 
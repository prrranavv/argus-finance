"use client";

import { useState, useCallback, useMemo } from "react";
import { SyncStep } from "@/components/gmail-sync-progress-bar";
import { createClientClient } from '@/lib/supabase';

interface EmailData {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  fullBody: string;
  cleanedBody?: string;
  cleaned?: boolean;
  cleaningError?: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId?: string;
  }>;
  index: number;
  messageSize: number;
}

interface Transaction {
  amount: number;
  description: string;
  date: string;
  type: "debit" | "credit";
  bank?: string;
  account_last_digits?: string;
  merchant?: string;
  category?: string;
  currency?: string;
  balance?: number;
  reference_number?: string;
  email_id: string;
  gmail_message_id: string;
  email_subject: string;
  email_from: string;
  email_date: string;
  processed_at: string;
}

interface SyncResults {
  emails: EmailData[];
  transactions: Transaction[];
  emailSaveResults: { savedEmails: number; message: string } | null;
  transactionSaveResults: { savedTransactions: number; message: string } | null;
  syncStats: { totalFound: number; newEmails: number; existingEmails: number } | null;
}

export function useGmailSync() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SyncStep[]>([]);
  const [results, setResults] = useState<SyncResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client for getting user session
  const supabase = useMemo(() => createClientClient(), []);

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to get authentication session');
    }
    
    if (!session?.access_token) {
      console.error('No session or access token available');
      throw new Error('No authentication token available. Please sign in again.');
    }
    
    console.log('🔑 Got access token for API call');
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const initializeSteps = useCallback(() => {
    const syncSteps: SyncStep[] = [
      {
        id: 'check-existing',
        title: 'Checking existing emails',
        emoji: '',
        status: 'pending'
      },
      {
        id: 'fetch-emails',
        title: 'Fetching your emails',
        emoji: '',
        status: 'pending'
      },
      {
        id: 'clean-emails',
        title: 'Reading and cleaning them',
        emoji: '',
        status: 'pending'
      },
      {
        id: 'save-emails',
        title: 'Saving emails to database',
        emoji: '',
        status: 'pending'
      },
      {
        id: 'analyze-emails',
        title: 'Analyzing with AI',
        emoji: '',
        status: 'pending'
      },
      {
        id: 'save-transactions',
        title: 'Saving transactions',
        emoji: '',
        status: 'pending'
      }
    ];
    setSteps(syncSteps);
    setCurrentStep(0);
    return syncSteps;
  }, []);

  const updateStepStatus = useCallback((stepId: string, status: SyncStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message }
        : step
    ));
    
    if (status === 'running') {
      const stepIndex = steps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [steps]);

  const runSync = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    const syncSteps = initializeSteps();
    let emails: EmailData[] = [];
    let transactions: Transaction[] = [];
    let emailSaveResults = null;
    let transactionSaveResults = null;
    let syncStats = null;

    try {
      // Step 1: Check existing emails
      updateStepStatus('check-existing', 'running');
      console.log('🔍 Checking for existing emails in database...');
      
      const authHeaders = await getAuthHeaders();
      const existingResponse = await fetch('/api/gmail/get-existing-message-ids', {
        headers: authHeaders
      });
      const existingResult = await existingResponse.json();
      
      if (!existingResponse.ok) {
        throw new Error(existingResult.error || 'Failed to get existing message IDs');
      }
      
      const existingMessageIds = existingResult.messageIds || [];
      console.log(`📋 Found ${existingMessageIds.length} existing emails in database`);
      updateStepStatus('check-existing', 'completed');

      // Step 2: Fetch emails from Gmail
      updateStepStatus('fetch-emails', 'running');
      console.log('📧 Fetching current month emails from Gmail...');
      
      const fetchResponse = await fetch('/api/gmail/fetch-emails', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ excludeMessageIds: existingMessageIds }),
      });

      const fetchResult = await fetchResponse.json();
      
      if (!fetchResponse.ok) {
        throw new Error(fetchResult.error || 'Failed to fetch emails');
      }

      // Check if no new emails found
      if (fetchResult.emails.length === 0) {
        updateStepStatus('fetch-emails', 'completed', `No new emails found. ${fetchResult.message || ''}`);
        // Complete all remaining steps as they're not needed
        syncSteps.slice(2).forEach(step => {
          updateStepStatus(step.id, 'completed', 'Skipped - no new emails');
        });
        setResults({
          emails: [],
          transactions: [],
          emailSaveResults: null,
          transactionSaveResults: null,
          syncStats: {
            totalFound: fetchResult.totalFound || 0,
            newEmails: 0,
            existingEmails: fetchResult.existingEmails || 0
          }
        });
        return;
      }

      emails = fetchResult.emails;
      syncStats = {
        totalFound: fetchResult.totalFound || fetchResult.emails.length,
        newEmails: fetchResult.newEmails || fetchResult.emails.length,
        existingEmails: fetchResult.existingEmails || 0
      };
      
      console.log(`📧 Smart sync found ${fetchResult.newEmails} new emails out of ${fetchResult.totalFound} total`);
      updateStepStatus('fetch-emails', 'completed');

      // Step 3: Clean emails with OpenAI
      updateStepStatus('clean-emails', 'running');
      console.log('🧽 Cleaning email content with OpenAI...');
      
      const cleanResponse = await fetch('/api/gmail/clean-email-content', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ emails }),
      });

      const cleanResult = await cleanResponse.json();
      
      if (!cleanResponse.ok) {
        throw new Error(cleanResult.error || 'Failed to clean email content');
      }

      emails = cleanResult.emails || [];
      console.log('Emails cleaned:', emails.length);
      updateStepStatus('clean-emails', 'completed');

      // Step 4: Save emails to database
      updateStepStatus('save-emails', 'running');
      console.log('💾 Saving cleaned emails to database...');
      
      const saveEmailResponse = await fetch('/api/gmail/save-email-data', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ emails }),
      });

      const saveEmailResult = await saveEmailResponse.json();
      
      if (!saveEmailResponse.ok) {
        throw new Error(saveEmailResult.error || 'Failed to save emails');
      }

      emailSaveResults = {
        savedEmails: saveEmailResult.totalEmails || saveEmailResult.savedEmails,
        message: `${saveEmailResult.message} (${syncStats.newEmails} new emails synced)`
      };
      
      console.log('✅ Emails saved to database:', saveEmailResult);
      updateStepStatus('save-emails', 'completed');

      // Step 5: Analyze emails with AI
      updateStepStatus('analyze-emails', 'running');
      console.log('🤖 Analyzing emails with AI...');
      
      const analysisPromises = emails.map(async (email) => {
        try {
          const response = await fetch('/api/gmail/process-email', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ email }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            console.error('Failed to process email:', result.error);
            return null;
          }

          return result.success && result.transaction ? result.transaction : null;
        } catch (error) {
          console.error('Error processing email:', error);
          return null;
        }
      });

      const analysisResults = await Promise.all(analysisPromises);
      transactions = analysisResults.filter(Boolean) as Transaction[];
      
      console.log(`🤖 Found ${transactions.length} transactions`);
      updateStepStatus('analyze-emails', 'completed');

      // Step 6: Save transactions to database
      updateStepStatus('save-transactions', 'running');
      
      if (transactions.length > 0) {
        console.log('💰 Saving transactions to database...');
        
        const saveTransactionResponse = await fetch('/api/gmail/save-transactions', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ transactions }),
        });

        const saveTransactionResult = await saveTransactionResponse.json();
        
        if (!saveTransactionResponse.ok) {
          throw new Error(saveTransactionResult.error || 'Failed to save transactions');
        }

        transactionSaveResults = {
          savedTransactions: saveTransactionResult.totalTransactions || saveTransactionResult.savedTransactions,
          message: saveTransactionResult.message
        };
        
        console.log('✅ Transactions saved successfully:', saveTransactionResult);
      } else {
        console.log('ℹ️ No transactions to save');
        transactionSaveResults = {
          savedTransactions: 0,
          message: 'No transactions found in analyzed emails'
        };
      }
      
      updateStepStatus('save-transactions', 'completed');

      // Set final results
      setResults({
        emails,
        transactions,
        emailSaveResults,
        transactionSaveResults,
        syncStats
      });

    } catch (error) {
      console.error('Error during Gmail sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Update current step as error
      const currentStepId = syncSteps[currentStep]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error', errorMessage);
      }
    } finally {
      setIsRunning(false);
    }
  }, [currentStep, initializeSteps, updateStepStatus]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
    setSteps([]);
    setResults(null);
    setError(null);
  }, []);

  return {
    isRunning,
    currentStep,
    steps,
    results,
    error,
    runSync,
    reset
  };
} 
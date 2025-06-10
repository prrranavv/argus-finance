"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Loader2, 
  RefreshCw, 
  User, 
  Calendar, 
  Hash, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Paperclip,
  Sparkles
} from "lucide-react";

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

interface GmailSyncModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  syncResults?: SyncResults | null;
}

export function GmailSyncModal({ isOpen, onOpenChange, syncResults }: GmailSyncModalProps) {
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [cleaningEmails, setCleaningEmails] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [gmailEmails, setGmailEmails] = useState<EmailData[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [processedTransactions, setProcessedTransactions] = useState<Transaction[]>([]);
  const [emailAnalysisResults, setEmailAnalysisResults] = useState<Record<string, { success: boolean; transaction: Transaction | null; message: string; error?: string; email_info?: any }>>({});
  const [emailSaveResults, setEmailSaveResults] = useState<{ savedEmails: number; message: string } | null>(null);
  const [transactionSaveResults, setTransactionSaveResults] = useState<{ savedTransactions: number; message: string } | null>(null);
  const [syncStats, setSyncStats] = useState<{ totalFound: number; newEmails: number; existingEmails: number } | null>(null);

  // Load sync results from header if provided
  useEffect(() => {
    if (syncResults && isOpen) {
      setGmailEmails(syncResults.emails);
      setProcessedTransactions(syncResults.transactions);
      setEmailSaveResults(syncResults.emailSaveResults);
      setTransactionSaveResults(syncResults.transactionSaveResults);
      setSyncStats(syncResults.syncStats);
      
      // Create analysis results from transactions
      const analysisResults: Record<string, { success: boolean; transaction: Transaction | null; message: string; error?: string; email_info?: any }> = {};
      syncResults.emails.forEach(email => {
        const transaction = syncResults.transactions.find(t => t.gmail_message_id === email.id);
        analysisResults[email.id] = {
          success: !!transaction,
          transaction: transaction || null,
          message: transaction ? 'Transaction extracted successfully' : 'No transaction found',
          email_info: null
        };
      });
      setEmailAnalysisResults(analysisResults);
    }
  }, [syncResults, isOpen]);

  const fetchGmailEmails = async () => {
    setFetchingEmails(true);
    setCleaningEmails(false);
    setGmailEmails([]);
    setProcessedTransactions([]);
    setEmailAnalysisResults({});
    setExpandedSubjects(new Set());
    setExpandedEmails(new Set());
    setEmailSaveResults(null);
    setTransactionSaveResults(null);
    setSyncStats(null);
    
    try {
      // Step 1: Get existing message IDs from database (current month)
      console.log('🔍 Checking for existing emails in database...');
      const existingResponse = await fetch('/api/gmail/get-existing-message-ids');
      const existingResult = await existingResponse.json();
      
      if (!existingResponse.ok) {
        throw new Error(existingResult.error || 'Failed to get existing message IDs');
      }
      
      const existingMessageIds = existingResult.messageIds || [];
      console.log(`📋 Found ${existingMessageIds.length} existing emails in database`);

      // Step 2: Fetch emails from Gmail (current month only)
      console.log('📧 Fetching current month emails from Gmail...');
      const response = await fetch('/api/gmail/fetch-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          excludeMessageIds: existingMessageIds // Smart sync: exclude existing emails
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch emails');
      }

      // Check if no new emails found
      if (result.emails.length === 0) {
        alert(`📧 Smart Sync Complete!\n\n${result.message || 'No new emails found to sync.'}\n\nTotal emails found: ${result.totalFound || 0}\nNew emails: ${result.newEmails || 0}\nAlready in database: ${result.existingEmails || 0}`);
        return;
      }

      console.log(`📧 Smart sync found ${result.newEmails} new emails out of ${result.totalFound} total`);
      console.log('Gmail emails fetched:', result.emails);
      
      // Store sync statistics
      setSyncStats({
        totalFound: result.totalFound || result.emails.length,
        newEmails: result.newEmails || result.emails.length,
        existingEmails: result.existingEmails || 0
      });
      
      // Step 3: Clean emails with OpenAI
      setFetchingEmails(false);
      setCleaningEmails(true);
      
      const cleanResponse = await fetch('/api/gmail/clean-email-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: result.emails }),
      });

      const cleanResult = await cleanResponse.json();

      if (!cleanResponse.ok) {
        throw new Error(cleanResult.error || 'Failed to clean email content');
      }

      const cleanedEmails = cleanResult.emails || [];
      setGmailEmails(cleanedEmails);
      console.log('Emails cleaned:', cleanedEmails);
      
      // Step 4: Automatically save cleaned emails to database
      console.log('💾 Saving cleaned emails to database...');
      
      const saveEmailResponse = await fetch('/api/gmail/save-email-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: cleanedEmails }),
      });

      const saveEmailResult = await saveEmailResponse.json();

      if (!saveEmailResponse.ok) {
        throw new Error(saveEmailResult.error || 'Failed to save emails');
      }

      setEmailSaveResults({
        savedEmails: saveEmailResult.totalEmails || saveEmailResult.savedEmails,
        message: `${saveEmailResult.message} (${result.newEmails} new emails synced)`
      });

      console.log('✅ Emails saved to database:', saveEmailResult);
      
    } catch (error) {
      console.error('Error processing Gmail emails:', error);
      alert('Failed to process Gmail emails: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setFetchingEmails(false);
      setCleaningEmails(false);
    }
  };

  const analyzeAllEmails = async () => {
    if (gmailEmails.length === 0) return;

    setAnalyzingAll(true);
    const newProcessingEmails = new Set(gmailEmails.map(email => email.id));
    setProcessingEmails(newProcessingEmails);

    try {
      // Process all emails in parallel
      const analysisPromises = gmailEmails.map(async (email) => {
        try {
          const response = await fetch('/api/gmail/process-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to process email');
          }

          // Store the analysis result for this email
          const analysisResult = {
            success: result.success,
            transaction: result.transaction,
            message: result.message,
            email_info: result.email_info,
            error: undefined
          };

          setEmailAnalysisResults(prev => ({
            ...prev,
            [email.id]: analysisResult
          }));

          if (result.success && result.transaction) {
            setProcessedTransactions(prev => [...prev, result.transaction]);
          }

          return { emailId: email.id, result: analysisResult };
          
        } catch (error) {
          console.error('Error processing email:', error);
          
          const errorResult = {
            success: false,
            transaction: null,
            message: 'Failed to process email',
            email_info: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          };

          setEmailAnalysisResults(prev => ({
            ...prev,
            [email.id]: errorResult
          }));

          return { emailId: email.id, result: errorResult };
        }
      });

      const analysisResults = await Promise.all(analysisPromises);

      // Collect successful transactions from analysis results
      const successfulTransactions = analysisResults
        .filter(result => result.result.success && result.result.transaction)
        .map(result => result.result.transaction);

      // Automatically save transactions to database after analysis
      if (successfulTransactions.length > 0) {
        console.log(`💰 Found ${successfulTransactions.length} transactions to save`);
        await saveTransactionsDirectly(successfulTransactions);
      } else {
        console.log('ℹ️ No transactions found during analysis');
      }

    } catch (error) {
      console.error('Error during bulk analysis:', error);
    } finally {
      setAnalyzingAll(false);
      setProcessingEmails(new Set());
    }
  };

  const saveTransactionsDirectly = async (transactions: Transaction[]) => {
    setSavingData(true);
    setTransactionSaveResults(null);

    try {
      console.log(`💰 Saving ${transactions.length} transactions to database...`);

      const response = await fetch('/api/gmail/save-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save transactions');
      }

      setTransactionSaveResults({
        savedTransactions: result.totalTransactions || result.savedTransactions,
        message: result.message
      });

      console.log('✅ Transactions saved successfully:', result);

    } catch (error) {
      console.error('Error saving transactions:', error);
      alert('Failed to save transactions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingData(false);
    }
  };

  const saveTransactionsToDatabase = async () => {
    if (processedTransactions.length === 0) {
      console.log('ℹ️ No transactions to save');
      return;
    }

    await saveTransactionsDirectly(processedTransactions);
  };

  const toggleSubjectExpansion = (emailId: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleEmailExpansion = (emailId: string) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // For sync results modal (when syncResults is provided)
  if (syncResults) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Gmail Sync Results</span>
            </DialogTitle>
            <DialogDescription>
              Summary of your Gmail sync and processed emails
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 border border-border rounded-lg text-center">
                  <div className="text-lg font-bold text-foreground">
                    {syncResults.syncStats?.totalFound || syncResults.emails?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Emails</div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {syncResults.syncStats?.newEmails || 0}
                  </div>
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70">New Emails</div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {syncResults.syncStats?.existingEmails || 0}
                  </div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">Existing Emails</div>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {syncResults.transactions?.length || 0}
                  </div>
                  <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Transactions Added</div>
                </div>
              </div>
            </div>

            {/* Email Content (Collapsed by default) */}
            {syncResults.emails && syncResults.emails.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Processed Emails ({syncResults.emails.length})</h3>
                  <Badge variant="secondary">{syncResults.emails.length} emails</Badge>
                </div>
                
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {syncResults.emails.map((email) => {
                    const isExpanded = expandedEmails.has(email.id);
                    return (
                      <div key={email.id} className="border border-border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {email.subject}
                            </h4>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{email.from}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(email.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => toggleEmailExpansion(email.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-border pt-2 mt-2">
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-border max-h-48 overflow-y-auto">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {email.cleanedBody || email.fullBody || email.body || 'No content available'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Original modal for manual sync
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Gmail Transaction Sync</span>
          </DialogTitle>
          <DialogDescription>
            Fetch emails from Gmail, clean content with AI, and extract transaction data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fetch Emails Section */}
          <div className="space-y-4">
            <Button
              onClick={fetchGmailEmails}
              disabled={fetchingEmails || cleaningEmails}
              className="w-full"
              size="lg"
            >
              {fetchingEmails ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching emails from Gmail...
                </>
              ) : cleaningEmails ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <Sparkles className="mr-2 h-4 w-4" />
                  Cleaning email content with AI...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Smart Sync - Current Month Emails
                </>
              )}
            </Button>

            {/* Analyze All Button */}
            {gmailEmails.length > 0 && (
              <Button
                onClick={analyzeAllEmails}
                disabled={analyzingAll || fetchingEmails || cleaningEmails || savingData}
                className="w-full"
                variant="secondary"
                size="lg"
              >
                {analyzingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing all emails with AI...
                  </>
                ) : savingData ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving data to database...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze All Emails ({gmailEmails.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Processed Transactions Summary */}
          {processedTransactions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Extracted Transactions</h3>
                <Badge variant="default">{processedTransactions.length} transactions</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Successfully extracted {processedTransactions.length} transaction{processedTransactions.length !== 1 ? 's' : ''} from your Gmail emails.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
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

interface GmailSyncModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GmailSyncModal({ isOpen, onOpenChange }: GmailSyncModalProps) {
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

          {/* Fetched Emails */}
          {gmailEmails.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fetched Emails ({gmailEmails.length})</h3>
                <Badge variant="secondary">{gmailEmails.length} emails</Badge>
              </div>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {gmailEmails.map((email) => {
                  const isSubjectExpanded = expandedSubjects.has(email.id);
                  const isEmailExpanded = expandedEmails.has(email.id);
                  const hasLongSubject = email.subject.length > 80;
                  const analysisResult = emailAnalysisResults[email.id];
                  const isProcessing = processingEmails.has(email.id);

                  return (
                    <div key={email.id} className={`border rounded-lg p-4 space-y-3 ${
                      analysisResult?.success && analysisResult.transaction 
                        ? 'bg-green-50 border-green-200' 
                        : ''
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm ${!isSubjectExpanded && hasLongSubject ? 'line-clamp-2' : ''}`}>
                                {email.subject}
                              </h4>
                              {hasLongSubject && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => toggleSubjectExpansion(email.id)}
                                >
                                  {isSubjectExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      Show full subject
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            {analysisResult && (
                              <div className="flex items-center space-x-1">
                                {analysisResult.success && analysisResult.transaction ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : analysisResult.error ? (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                            )}
                            {isProcessing && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">{email.from}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(email.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Hash className="h-3 w-3" />
                              <span>{formatFileSize(email.messageSize)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attachments */}
                      {email.attachments.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {email.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={`/api/gmail/download-attachment?messageId=${email.id}&attachmentId=${attachment.attachmentId}&filename=${encodeURIComponent(attachment.filename)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                <span>{attachment.filename}</span>
                                <span className="text-blue-500">({formatFileSize(attachment.size)})</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Content */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {email.cleaned ? 'Cleaned Email Content' : 'Email Content'}
                            {email.cleaned && <span className="ml-1 text-green-600">✨</span>}
                            {email.cleaningError && <span className="ml-1 text-red-600">⚠️</span>}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleEmailExpansion(email.id)}
                          >
                            {isEmailExpanded ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Show less
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Show full content
                              </>
                            )}
                          </Button>
                        </div>
                        <div className={`text-xs text-muted-foreground bg-muted/50 p-3 rounded border ${isEmailExpanded ? 'max-h-96' : 'max-h-20'} overflow-y-auto`}>
                          {isEmailExpanded ? (
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {email.cleanedBody || email.fullBody || email.body || 'No content available'}
                            </pre>
                          ) : (
                            <div>
                              {(email.cleanedBody || email.body || '').substring(0, 200)}...
                            </div>
                          )}
                        </div>
                        {email.cleaningError && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                            Cleaning error: {email.cleaningError}
                          </div>
                        )}
                      </div>

                      {/* AI Analysis Result */}
                      {analysisResult && (
                        <div className={`p-3 rounded-lg border ${
                          analysisResult.success && analysisResult.transaction
                            ? 'bg-green-50 border-green-200'
                            : analysisResult.error
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="text-xs font-medium">
                            AI Analysis Result:
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {analysisResult.message}
                          </div>
                          {analysisResult.error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {analysisResult.error}
                            </div>
                          )}
                          {analysisResult.transaction && (
                            <div className="mt-2 p-2 bg-white rounded border">
                              <div className="text-xs font-medium">
                                {analysisResult.transaction.description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Amount: ₹{analysisResult.transaction.amount} | 
                                Type: {analysisResult.transaction.type} | 
                                Date: {analysisResult.transaction.date}
                              </div>
                              {analysisResult.transaction.merchant && (
                                <div className="text-xs text-muted-foreground">
                                  Merchant: {analysisResult.transaction.merchant}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sync Statistics */}
          {syncStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Smart Sync Statistics</h3>
                <Badge variant="outline">Current Month</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-700">{syncStats.totalFound}</div>
                  <div className="text-xs text-gray-500">Total Found</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-700">{syncStats.newEmails}</div>
                  <div className="text-xs text-blue-500">New Emails</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-700">{syncStats.existingEmails}</div>
                  <div className="text-xs text-green-500">Already Synced</div>
                </div>
              </div>
            </div>
          )}

          {/* Save Results */}
          {(emailSaveResults || transactionSaveResults) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database Save Results</h3>
                <Badge variant="default" className="bg-green-600">
                  ✅ Saved Successfully
                </Badge>
              </div>
              
              {emailSaveResults && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    {emailSaveResults.message}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    📧 {emailSaveResults.savedEmails} emails processed
                  </div>
                </div>
              )}
              
              {transactionSaveResults && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">
                    {transactionSaveResults.message}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    💰 {transactionSaveResults.savedTransactions} transactions processed
                  </div>
                </div>
              )}
            </div>
          )}

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
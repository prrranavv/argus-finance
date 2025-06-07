"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Calendar, Hash, ChevronDown, ChevronRight, Filter, Trash2, Loader2 } from "lucide-react";
import { DeleteStatementButton } from "@/components/delete-statement-button";

interface TransactionData {
  id: string;
  date: Date;
  description: string;
  amount: number;
  closingBalance: number | null;
  category: string | null;
  type: string;
  source: string;
  accountType: string;
  bankName: string;
  statementId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StatementData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash?: string | null;
  uploadedAt: Date;
  processed: boolean;
  transactions: TransactionData[];
}

export function UploadedStatementsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [statements, setStatements] = useState<StatementData[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("All");
  const [bankNameFilter, setBankNameFilter] = useState<string>("All");
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatements();
    }
  }, [isOpen]);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/statements');
      const data = await response.json();
      setStatements(data.map((s: any) => ({
        ...s,
        uploadedAt: new Date(s.uploadedAt),
        transactions: s.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }))
      })));
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllStatements = async () => {
    setIsClearingAll(true);
    try {
      const response = await fetch('/api/clear-all-statements', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear statements');
      }

      // Clear local state
      setStatements([]);
      console.log('All statements cleared successfully');
    } catch (error) {
      console.error('Error clearing statements:', error);
    } finally {
      setIsClearingAll(false);
    }
  };

  // Get unique account types and bank names for filters
  const { accountTypes, bankNames } = useMemo(() => {
    const accountTypesSet = new Set<string>();
    const bankNamesSet = new Set<string>();
    
    statements.forEach(statement => {
      if (statement.transactions.length > 0) {
        const firstTransaction = statement.transactions[0];
        accountTypesSet.add(firstTransaction.accountType);
        bankNamesSet.add(firstTransaction.bankName);
      }
    });
    
    return {
      accountTypes: Array.from(accountTypesSet).sort(),
      bankNames: Array.from(bankNamesSet).sort()
    };
  }, [statements]);

  // Filter statements based on selected filters
  const filteredStatements = useMemo(() => {
    return statements.filter(statement => {
      if (statement.transactions.length === 0) return true;
      
      const firstTransaction = statement.transactions[0];
      const accountTypeMatch = accountTypeFilter === "All" || firstTransaction.accountType === accountTypeFilter;
      const bankNameMatch = bankNameFilter === "All" || firstTransaction.bankName === bankNameFilter;
      
      return accountTypeMatch && bankNameMatch;
    });
  }, [statements, accountTypeFilter, bankNameFilter]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to format statement title based on transaction data
  const formatStatementTitle = (statement: StatementData): string => {
    if (!statement.transactions || statement.transactions.length === 0) {
      return statement.fileName; // Fallback to original filename if no transactions
    }

    // Get the first transaction to extract bankName and accountType
    const firstTransaction = statement.transactions[0];
    const bankName = firstTransaction.bankName || 'Unknown Bank';
    const accountType = firstTransaction.accountType || 'Account';

    // Get the month/year from the statement's transactions
    // Use the earliest transaction date to determine the statement period
    const transactionDates = statement.transactions.map((t: TransactionData) => new Date(t.date));
    const earliestDate = new Date(Math.min(...transactionDates.map((d: Date) => d.getTime())));
    
    const monthYear = earliestDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    return `${bankName} ${accountType} - ${monthYear}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Uploaded Statements
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uploaded Statements</DialogTitle>
          <DialogDescription>
            View and manage your uploaded financial statements
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filters and Actions */}
              <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Filters:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Account Type:</span>
                    <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        {accountTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Bank/Card:</span>
                    <Select value={bankNameFilter} onValueChange={setBankNameFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Banks/Cards</SelectItem>
                        {bankNames.map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {statements.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isClearingAll}
                      >
                        {isClearingAll ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Statements</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete all uploaded statements and their transactions?
                          <br /><br />
                          This will permanently remove:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All {statements.length} uploaded statement files</li>
                            <li>All associated transactions from all statements</li>
                          </ul>
                          <br />
                          <strong className="text-red-600">This action cannot be undone.</strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={clearAllStatements}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isClearingAll}
                        >
                          {isClearingAll ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Clearing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear All
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Uploaded Statements</span>
                <Badge variant="secondary">
                  {filteredStatements.length}
                  {filteredStatements.length !== statements.length && (
                    <span className="text-muted-foreground ml-1">of {statements.length}</span>
                  )}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  {filteredStatements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {statements.length === 0 ? (
                        <>
                          <div className="mb-2">✨ Fresh start! No statements have been processed yet.</div>
                          <div className="text-sm">Upload a financial statement to get started with AI-powered analysis.</div>
                        </>
                      ) : (
                        <>
                          <div className="mb-2">🔍 No statements match the selected filters.</div>
                          <div className="text-sm">Try adjusting your filter criteria to see more results.</div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredStatements.map((statement) => (
                        <div
                          key={statement.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{formatStatementTitle(statement)}</span>
                              <Badge variant={statement.processed ? 'default' : 'secondary'}>
                                {statement.processed ? 'Processed' : 'Pending'}
                              </Badge>
                              {statement.transactions.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {statement.transactions[0].accountType}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {statement.uploadedAt.toLocaleDateString()}
                                </span>
                                <span>{formatFileSize(statement.fileSize)}</span>
                                <span>{statement.fileType}</span>
                              </div>
                              {/* Temporarily commenting out fileHash display until Prisma types are updated */}
                              {/* {statement.fileHash && (
                                <div className="flex items-center text-xs">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {statement.fileHash.substring(0, 16)}...
                                </div>
                              )} */}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-semibold">
                                {statement.transactions.length}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                transactions
                              </div>
                            </div>
                            <DeleteStatementButton
                              statementId={statement.id}
                              fileName={statement.fileName}
                              transactionCount={statement.transactions.length}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
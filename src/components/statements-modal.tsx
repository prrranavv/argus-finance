"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, File, X, CheckCircle, AlertCircle, FileText, ChevronDown, ChevronRight, Calendar, Hash, Filter, Trash2, Loader2 } from "lucide-react";
import { DeleteStatementButton } from "@/components/delete-statement-button";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error" | "duplicate";
  progress: number;
  message?: string;
  updatedTitle?: string;
}

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

interface StatementsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatementsModal({ isOpen, onOpenChange }: StatementsModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showExistingStatements, setShowExistingStatements] = useState(false);
  const [statements, setStatements] = useState<StatementData[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("All");
  const [bankNameFilter, setBankNameFilter] = useState<string>("All");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 15),
      status: "pending" as const,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const processFile = async (fileId: string) => {
    const fileData = uploadedFiles.find(f => f.id === fileId);
    if (!fileData) return;

    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, status: "uploading", progress: 0 } : file
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', fileData.file);

      // Update progress to show processing has started
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, progress: 25 } : file
        )
      );

      const response = await fetch('/api/process-statement', {
        method: 'POST',
        body: formData,
      });

      // Update progress
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, progress: 75 } : file
        )
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process file');
      }

      // Generate updated title based on metadata
      let updatedTitle = fileData.file.name;
      if (result.data?.metadata) {
        const { bankName, accountType, dateRange } = result.data.metadata;
        const startDate = new Date(dateRange.start);
        const monthYear = startDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        updatedTitle = `${bankName} ${accountType} - ${monthYear}`;
      }

      // Check if file was a duplicate
      if (result.duplicate) {
        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId ? { 
              ...file, 
              status: "duplicate", 
              progress: 100,
              message: `File already processed with ${result.data.transactionCount} transactions`,
              updatedTitle
            } : file
          )
        );
      } else {
        // Complete processing
        const duplicatesMessage = result.data.duplicatesSkipped > 0 
          ? ` (${result.data.duplicatesSkipped} duplicates skipped)`
          : '';
        
        setUploadedFiles((prev) =>
          prev.map((file) =>
            file.id === fileId ? { 
              ...file, 
              status: "completed", 
              progress: 100,
              message: `${result.data.transactionCount} transactions processed${duplicatesMessage}`,
              updatedTitle
            } : file
          )
        );
      }

      console.log('File processed successfully:', result);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadedFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { 
            ...file, 
            status: "error", 
            progress: 0,
            message: error instanceof Error ? error.message : 'Processing failed'
          } : file
        )
      );
    }
  };

  const handleUpload = async () => {
    const pendingFiles = uploadedFiles.filter((file) => file.status === "pending");
    
    // Process files in parallel instead of sequentially
    const processPromises = pendingFiles.map(file => processFile(file.id));
    await Promise.all(processPromises);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const fetchStatements = async () => {
    setLoadingStatements(true);
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
      setLoadingStatements(false);
    }
  };

  const formatStatementTitle = (statement: StatementData): string => {
    if (!statement.transactions || statement.transactions.length === 0) {
      return statement.fileName;
    }

    const firstTransaction = statement.transactions[0];
    const bankName = firstTransaction.bankName || 'Unknown Bank';
    const accountType = firstTransaction.accountType || 'Account';

    const transactionDates = statement.transactions.map((t: TransactionData) => new Date(t.date));
    const earliestDate = new Date(Math.min(...transactionDates.map((d: Date) => d.getTime())));
    
    const monthYear = earliestDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    return `${bankName} ${accountType} - ${monthYear}`;
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

  // Load statements when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatements();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statement Management</DialogTitle>
          <DialogDescription>
            Import new statements or manage existing ones. Supported formats: PDF, CSV, XLS, XLSX.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import New Statements</h3>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              {isDragActive ? (
                <p className="text-muted-foreground">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-1">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 10MB per file
                  </p>
                </div>
              )}
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Queued Files</h4>
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.updatedTitle || file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </p>
                      {file.message && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.message}
                        </p>
                      )}
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="mt-2" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {file.status === "duplicate" && (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {(file.status === "pending" || file.status === "error") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {uploadedFiles.some((file) => file.status === "pending") && (
                  <Button onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Process Files ({uploadedFiles.filter((file) => file.status === "pending").length})
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Existing Statements Section */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowExistingStatements(!showExistingStatements)}
              className="w-full justify-between p-0 h-auto"
            >
              <div className="flex items-center space-x-2">
                {showExistingStatements ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <h3 className="text-lg font-semibold">Existing Statements ({statements.length})</h3>
              </div>
            </Button>

            {showExistingStatements && (
              <div className="space-y-4">
                {loadingStatements ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading statements...</span>
                  </div>
                ) : filteredStatements.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No statements found</p>
                  </div>
                ) : (
                  <>
                    {/* Filters */}
                    {(accountTypes.length > 0 || bankNames.length > 0) && (
                      <div className="flex flex-wrap gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>
                        
                        {accountTypes.length > 0 && (
                          <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Account Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Types</SelectItem>
                              {accountTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {bankNames.length > 0 && (
                          <Select value={bankNameFilter} onValueChange={setBankNameFilter}>
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Bank Name" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Banks</SelectItem>
                              {bankNames.map(bank => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* Statements List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {filteredStatements.map((statement) => (
                        <div key={statement.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium text-sm">
                                {formatStatementTitle(statement)}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {statement.fileName} • {formatFileSize(statement.fileSize)}
                              </p>
                            </div>
                            <DeleteStatementButton 
                              statementId={statement.id} 
                              fileName={statement.fileName}
                              transactionCount={statement.transactions.length}
                            />
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {statement.transactions.length > 0 && (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {statement.transactions.length} transactions
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {statement.uploadedAt.toLocaleDateString()}
                                </Badge>
                                {statement.transactions[0] && (
                                  <Badge variant="outline" className="text-xs">
                                    {statement.transactions[0].accountType}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
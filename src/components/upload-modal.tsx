"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error" | "duplicate";
  progress: number;
  message?: string;
  updatedTitle?: string;
}

export function UploadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Financial Data</DialogTitle>
          <DialogDescription>
            Securely process any bank or credit card statement with Argus AI. Supported formats: PDF, CSV, XLS, XLSX.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, CSV, XLS, XLSX up to 10MB each
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadedFile.updatedTitle || uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                        {uploadedFile.message && (
                          <p className={`text-xs mt-1 ${
                            uploadedFile.status === 'duplicate' ? 'text-orange-600' :
                            uploadedFile.status === 'completed' ? 'text-green-600' :
                            uploadedFile.status === 'error' ? 'text-red-600' :
                            'text-muted-foreground'
                          }`}>
                            {uploadedFile.message}
                          </p>
                        )}
                        {uploadedFile.status === "uploading" && (
                          <Progress
                            value={uploadedFile.progress}
                            className="h-2 mt-1"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {uploadedFile.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadedFile.status === "duplicate" && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      {uploadedFile.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {uploadedFile.status !== "uploading" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadedFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {uploadedFiles.length > 0 && (
            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={
                  uploadedFiles.length === 0 ||
                  uploadedFiles.every((file) => file.status !== "pending")
                }
                className="flex-1"
                              >
                Analyze with Argus AI
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadedFiles([])}
                disabled={uploadedFiles.some((file) => file.status === "uploading")}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
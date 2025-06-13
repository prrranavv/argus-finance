"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2, X, AlertTriangle } from "lucide-react";
import { formatCurrencyInLakhs } from "@/lib/utils";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: string;
  source: string;
  bank_name: string;
}

interface DeleteTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onTransactionDeleted: () => void;
}

export function DeleteTransactionModal({
  transaction,
  isOpen,
  onClose,
  onTransactionDeleted
}: DeleteTransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/all-transactions/${transaction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      toast.success("Transaction deleted successfully!");
      onTransactionDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!transaction) return null;

  const canDelete = transaction.source === 'manual';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Transaction
          </DialogTitle>
          <DialogDescription>
            {canDelete 
              ? "This action cannot be undone. The transaction will be permanently deleted."
              : "Only manual transactions can be deleted. This transaction was imported from a statement or email."
            }
          </DialogDescription>
        </DialogHeader>

        {canDelete ? (
          <div className="space-y-4">
            {/* Transaction Details */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className={`font-semibold ${
                  transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrencyInLakhs(transaction.amount, false)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="font-medium text-right max-w-[200px] truncate">
                  {transaction.description}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bank:</span>
                <span className="font-medium">{transaction.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>Warning:</strong> This transaction will be permanently deleted and cannot be recovered.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Deleting..." : "Delete Transaction"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Transaction Details */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Source:</span>
                <span className="font-medium capitalize">{transaction.source}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Description:</span>
                <span className="font-medium text-right max-w-[200px] truncate">
                  {transaction.description}
                </span>
              </div>
            </div>

            {/* Info Message */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Info:</strong> Only manually created transactions can be deleted. 
                Transactions from statements and emails are protected to maintain data integrity.
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 
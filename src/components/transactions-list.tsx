"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TransactionFilterTabs } from "@/components/transaction-filter-tabs";
import { formatCurrencyInLakhs } from "@/lib/utils";

interface Transaction {
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

interface TransactionsListProps {
  transactions: Transaction[];
  isPrivacyMode?: boolean;
}

export function TransactionsList({ transactions, isPrivacyMode = false }: TransactionsListProps) {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);

  const handleFilterChange = (filtered: Transaction[]) => {
    setFilteredTransactions(filtered);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="mb-2">🎉 All cleaned up! No transactions in the database.</div>
        <div className="text-sm">Upload a financial statement to start building your transaction history with AI-powered categorization and duplicate prevention.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest financial transactions processed by AI</p>
        </div>
        <div className="flex justify-start sm:justify-end">
          <TransactionFilterTabs 
            transactions={transactions}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{transaction.description}</span>
                <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                  {transaction.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <span>{new Date(transaction.date).toLocaleDateString()}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {transaction.bankName}
                </span>
                <span className="text-xs text-gray-500">
                  {transaction.accountType}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrencyInLakhs(transaction.amount, isPrivacyMode)}
              </div>
              {transaction.closingBalance !== null && (
                <div className="text-xs text-muted-foreground">
                  Balance: {formatCurrencyInLakhs(transaction.closingBalance, isPrivacyMode)}
                </div>
              )}
              <div className="text-xs text-muted-foreground capitalize">
                {transaction.type}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="mb-2">No transactions match the selected filter.</div>
          <div className="text-sm">Try selecting a different filter option.</div>
        </div>
      )}
    </div>
  );
} 